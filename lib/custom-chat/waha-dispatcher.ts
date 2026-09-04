/**
 * Despachador de Mensagens e Mídias via WAHA
 * Com simulação de presença humana, digitação proporcional e tratamento de restrições.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MediaAttachment {
  type: "image" | "audio" | "video" | "document";
  url?: string;
  data?: string;
  dataUrl?: string;
  mimetype?: string;
  filename?: string;
  caption?: string;
  isRecordedVoice?: boolean;
}

export interface SendMessageOptions {
  session: string;
  chatId: string;
  text?: string;
  media?: MediaAttachment;
  simulateTyping?: boolean;
}

export interface WahaSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isTimelock?: boolean;
  isCapping?: boolean;
}

export interface WahaActiveSessionInfo {
  name: string;
  status: string;
  phone?: string;
  pushName?: string;
}

/**
 * Calcula tempo de digitação humana realista baseado no número de caracteres da mensagem.
 */
export function calculateTypingDuration(text?: string): number {
  if (!text || text.length === 0) return 1500;
  // Média de ~30ms por caractere + jitter aleatório de 200 a 500ms
  const baseMs = text.length * 30;
  const jitter = Math.floor(Math.random() * 400) + 100;
  const total = baseMs + jitter;
  return Math.min(5000, Math.max(1500, total));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dispara evento de presença no WAHA.
 */
async function setTypingPresence(
  baseUrl: string,
  apiKey: string,
  session: string,
  chatId: string,
  typing: boolean,
): Promise<void> {
  const endpoint = typing ? "startTyping" : "stopTyping";
  try {
    await fetch(`${baseUrl}/api/${endpoint}`, {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ session, chatId }),
    });
  } catch {
    // Falhas de presença não devem interromper o disparo
  }
}

const resolvedJidCache = new Map<string, string>();

/**
 * Garante que a sessão requisitada esteja iniciada (se estiver STOPPED no WAHA).
 */
export async function ensureSessionWorking(
  baseUrl: string,
  apiKey: string,
  session: string,
): Promise<void> {
  if (!session) return;
  try {
    const checkRes = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(session)}`, {
      headers: { "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(1500),
    });
    if (checkRes.ok) {
      const info = (await checkRes.json()) as { status?: string };
      if (info.status === "STOPPED") {
        logger.info("[waha-dispatcher] Sessão STOPPED detectada, iniciando automaticamente...", { session });
        await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(session)}/start`, {
          method: "POST",
          headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(3000),
        });
        // Pequena pausa para estabilização
        await sleep(1000);
      }
    }
  } catch {
    // Não bloqueia o envio caso a checagem falhe
  }
}

/**
 * Resolve o JID canônico consultando o WAHA (check-exists).
 * Lida de forma robusta com o 9º dígito brasileiro e identificadores canônicos.
 * Utiliza timeout estrito e cache em memória para evitar travamentos.
 */
export async function resolveTargetChatId(
  baseUrl: string,
  apiKey: string,
  session: string,
  rawChatId: string,
): Promise<string> {
  if (!rawChatId) return rawChatId;

  // Se já for @lid, grupo (@g.us), broadcast ou newsletter, não altera
  if (
    rawChatId.endsWith("@lid") ||
    rawChatId.endsWith("@g.us") ||
    rawChatId.endsWith("@broadcast") ||
    rawChatId.endsWith("@newsletter")
  ) {
    return rawChatId;
  }

  let cleanDigits = rawChatId.replace(/\D/g, "");
  if (!cleanDigits) return rawChatId;

  // Se for número brasileiro sem DDI 55 (ex: 31998622489 ou 3198622489)
  if (!cleanDigits.startsWith("55") && (cleanDigits.length === 10 || cleanDigits.length === 11)) {
    cleanDigits = `55${cleanDigits}`;
  }

  const cacheKey = `${session}:${cleanDigits}`;
  if (resolvedJidCache.has(cacheKey)) {
    return resolvedJidCache.get(cacheKey)!;
  }

  // Gera variantes (com e sem o 9º dígito) se for número do Brasil
  const variants: string[] = [cleanDigits];
  if (cleanDigits.startsWith("55")) {
    const ddd = cleanDigits.slice(2, 4);
    const local = cleanDigits.slice(4);
    if (local.length === 9 && local.startsWith("9")) {
      // 13 dígitos: 55 + DDD + 9xxxxxxxx -> tenta sem o 9 (12 dígitos)
      variants.push(`55${ddd}${local.slice(1)}`);
    } else if (local.length === 8 && /^[6-9]/.test(local)) {
      // 12 dígitos: 55 + DDD + xxxxxxxx -> tenta com o 9 (13 dígitos)
      variants.push(`55${ddd}9${local}`);
    }
  }

  for (const phoneVariant of variants) {
    try {
      const url = new URL(`${baseUrl}/api/contacts/check-exists`);
      url.searchParams.set("session", session);
      url.searchParams.set("phone", phoneVariant);
      const res = await fetch(url.toString(), {
        headers: { "X-Api-Key": apiKey, Accept: "application/json" },
        signal: AbortSignal.timeout(1200),
      });
      if (res.ok) {
        const data = (await res.json()) as { numberExists?: boolean; chatId?: string | null };
        if (data && data.numberExists && data.chatId) {
          logger.info("JID Canônico WhatsApp resolvido via WAHA", {
            input: rawChatId,
            variant: phoneVariant,
            resolvedChatId: data.chatId,
          });
          resolvedJidCache.set(cacheKey, data.chatId);
          return data.chatId;
        }
      }
    } catch {
      // Timeout ou erro de rede — não trava e prossegue
    }
  }

  const fallbackJid = cleanDigits ? `${cleanDigits}@c.us` : rawChatId;
  resolvedJidCache.set(cacheKey, fallbackJid);
  return fallbackJid;
}

export function toPureBase64(input?: string): string | undefined {
  if (!input) return undefined;
  const commaIdx = input.indexOf(",");
  if (input.startsWith("data:") && commaIdx !== -1) {
    return input.slice(commaIdx + 1).trim();
  }
  return input.trim();
}

/**
 * Converte qualquer formato de áudio (WebM, MP3, WAV) em Ogg Opus genuíno via ffmpeg.
 * Obrigatório para mensagens de voz PTT do WhatsApp.
 */
export async function convertToOggOpusBuffer(inputBuf: Buffer): Promise<Buffer> {
  if (inputBuf.length >= 4 && inputBuf.subarray(0, 4).toString("ascii") === "OggS") {
    return inputBuf;
  }

  return new Promise((resolve) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-i",
      "pipe:0",
      "-c:a",
      "libopus",
      "-b:a",
      "32k",
      "-vbr",
      "on",
      "-f",
      "ogg",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];
    ff.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    ff.stderr.on("data", () => {});
    ff.on("close", (code) => {
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        resolve(inputBuf);
      }
    });
    ff.on("error", () => {
      resolve(inputBuf);
    });

    ff.stdin.write(inputBuf);
    ff.stdin.end();
  });
}

/**
 * Envia uma mensagem ou mídia através da WAHA API com simulação opcional de digitação.
 */
export async function sendViaWaha(
  options: SendMessageOptions,
): Promise<WahaSendResult> {
  const baseUrl = process.env.WAHA_API_BASE_URL || "http://localhost:3035";
  const apiKey = process.env.WAHA_API_KEY || "";

  const { session, chatId, text, media, simulateTyping = true } = options;

  // Garante que a sessão requisitada não esteja STOPPED
  await ensureSessionWorking(baseUrl, apiKey, session);

  // 1. Resolve o JID canônico do WhatsApp (essencial para entrega em números BR com/sem 9º dígito)
  const targetChatId = await resolveTargetChatId(baseUrl, apiKey, session, chatId);

  // 2. Simulação de digitação humana
  if (simulateTyping) {
    const typingTime = calculateTypingDuration(text);
    await setTypingPresence(baseUrl, apiKey, session, targetChatId, true);
    await sleep(typingTime);
    await setTypingPresence(baseUrl, apiKey, session, targetChatId, false);
  }

  let mediaSentSuccess = false;
  let mediaMessageId: string | undefined;

  // 3. Envio da mídia se presente (suporta URL externa, upload local ou Base64)
  if (media && (media.url || media.data || media.dataUrl)) {
    let endpoint = "sendFile";
    let fileBuffer: Buffer | null = null;
    let mimetype = media.mimetype || "application/octet-stream";
    let filename = media.filename || "anexo";

    // 1. Obtém o buffer da mídia — PRIORIDADE: dataUrl (base64) > url
    // dataUrl é sempre preferível em Docker pois evita dependência de disco ou rede
    if (media.data || media.dataUrl) {
      const pureB64 = toPureBase64(media.data || media.dataUrl);
      if (pureB64) {
        try {
          fileBuffer = Buffer.from(pureB64, "base64");
        } catch (err) {
          logger.warn("[waha-dispatcher] Falha ao decodificar base64 da mídia", { err });
        }
      }
    }

    // Se não tem dataUrl, tenta via URL
    if (!fileBuffer && media.url) {
      if (media.url.startsWith("/uploads/")) {
        // Caminhos candidatos: dentro do container Docker o standalone fica em /app
        const candidatePaths = [
          path.join(process.cwd(), "public", media.url),
          path.join(process.cwd(), media.url),
          path.join("/app/public", media.url),
          path.join("/app", media.url),
          // Standalone Next.js copia public para dentro do .next/standalone
          path.join(process.cwd(), ".next", "standalone", "public", media.url),
          path.join(process.cwd(), "public", "uploads", "custom-chat", path.basename(media.url)),
        ];

        for (const cand of candidatePaths) {
          try {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
              fileBuffer = fs.readFileSync(cand);
              logger.info("[waha-dispatcher] Mídia encontrada em disco", { cand });
              break;
            }
          } catch {
            // tenta o próximo candidato
          }
        }

        // Se ainda não encontrou via disco, tenta via rota HTTP local da aplicação
        if (!fileBuffer) {
          try {
            const port = process.env.PORT || "3000";
            const resp = await fetch(`http://127.0.0.1:${port}${media.url}`);
            if (resp.ok) {
              const arr = await resp.arrayBuffer();
              fileBuffer = Buffer.from(arr);
              logger.info("[waha-dispatcher] Mídia obtida via HTTP local", { url: media.url });
            } else {
              logger.warn("[waha-dispatcher] Falha HTTP local ao buscar mídia", { url: media.url, status: resp.status });
            }
          } catch (err) {
            logger.warn("[waha-dispatcher] Exceção HTTP local ao buscar mídia", { url: media.url, err });
          }
        }
      } else if (media.url.startsWith("http://") || media.url.startsWith("https://")) {
        // URL pública ou de rede interna
        try {
          const resp = await fetch(media.url);
          if (resp.ok) {
            const arr = await resp.arrayBuffer();
            fileBuffer = Buffer.from(arr);
          } else {
            logger.warn("[waha-dispatcher] Falha ao baixar mídia de URL externa", { url: media.url, status: resp.status });
          }
        } catch (err) {
          logger.warn("[waha-dispatcher] Exceção ao baixar mídia de URL externa", { url: media.url, err });
        }
      } else if (!media.url.startsWith("blob:")) {
        // URL desconhecida — tenta buscar como URL pública
        logger.warn("[waha-dispatcher] Tipo de URL de mídia não reconhecido", { url: media.url.slice(0, 80) });
      }
    }

    // 2. Ajuste fino de MIME types e conversão Opus para PTT
    if (media.type === "audio") {
      endpoint = "sendVoice";
      mimetype = "audio/ogg; codecs=opus";
      filename = "voice.ogg";
      if (fileBuffer) {
        fileBuffer = await convertToOggOpusBuffer(fileBuffer);
      }
    } else if (media.type === "image") {
      endpoint = "sendImage";
      mimetype = media.mimetype || "image/jpeg";
      filename = media.filename || "imagem.jpg";
    } else if (media.type === "video") {
      endpoint = "sendVideo";
      mimetype = media.mimetype || "video/mp4";
      filename = media.filename || "video.mp4";
    } else {
      endpoint = "sendFile";
    }

    const filePayload: Record<string, unknown> = {
      mimetype,
      filename,
    };

    if (fileBuffer) {
      filePayload.data = fileBuffer.toString("base64");
    } else if (media.url) {
      filePayload.url = media.url;
    }

    const payload: Record<string, unknown> = {
      session,
      chatId: targetChatId,
      file: filePayload,
    };

    if (endpoint !== "sendVoice" && (text || media.caption)) {
      payload.caption = text || media.caption;
    }

    try {
      const res = await fetch(`${baseUrl}/api/${endpoint}`, {
        method: "POST",
        headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorText = JSON.stringify(data);
        const isTimelock = res.status === 463 || errorText.includes("463");
        const isCapping = res.status === 475 || errorText.includes("475");
        return {
          success: false,
          error: data.message || `Falha no envio de mídia (HTTP ${res.status})`,
          isTimelock,
          isCapping,
        };
      }

      mediaSentSuccess = true;
      mediaMessageId = data.id || data.key?.id;

      // Se for áudio PTT e houver texto complementar, prossegue para enviar a mensagem de texto separadamente
      if (media.type !== "audio" || !text) {
        return {
          success: true,
          messageId: mediaMessageId,
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Falha ao conectar ao servidor WAHA",
      };
    }
  }

  // 4. Envio de mensagem de texto simples (ou texto complementar após envio de áudio PTT)
  if (text) {
    try {
      const res = await fetch(`${baseUrl}/api/sendText`, {
        method: "POST",
        headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ session, chatId: targetChatId, text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorText = JSON.stringify(data);
        const isTimelock = res.status === 463 || errorText.includes("463");
        const isCapping = res.status === 475 || errorText.includes("475");
        return {
          success: false,
          error: data.message || `Falha no envio de texto (HTTP ${res.status})`,
          isTimelock,
          isCapping,
        };
      }

      return {
        success: true,
        messageId: data.id || data.key?.id || mediaMessageId,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Falha ao conectar ao servidor WAHA",
      };
    }
  }

  if (mediaSentSuccess) {
    return {
      success: true,
      messageId: mediaMessageId,
    };
  }

  return { success: false, error: "Nenhum conteúdo de texto ou mídia especificado." };
}

/**
 * Consulta sessões ativas no WAHA local para identificar a sessão operacional.
 * Usa `all=true` para garantir que sessões não-padrão apareçam na lista.
 */
export async function getActiveWahaSessions(): Promise<WahaActiveSessionInfo[]> {
  const baseUrl = process.env.WAHA_API_BASE_URL || "http://localhost:3035";
  const apiKey = process.env.WAHA_API_KEY || "";
  const sessionMap = new Map<string, WahaActiveSessionInfo>();

  // 1. Consulta instâncias no Supabase (Central de Conexões da Organização)
  try {
    const admin = createAdminClient();
    const { data: dbRows, error } = await admin
      .from("channel_sessions")
      .select("waha_session_name, display_name, phone_number, status, archived_at")
      .is("archived_at", null);

    if (!error && Array.isArray(dbRows)) {
      for (const row of dbRows) {
        if (row.waha_session_name) {
          sessionMap.set(row.waha_session_name, {
            name: row.waha_session_name,
            status: row.status || "WORKING",
            phone: row.phone_number || undefined,
            pushName: row.display_name || undefined,
          });
        }
      }
    }
  } catch (dbErr) {
    logger.warn("[waha-dispatcher] Falha ao consultar channel_sessions no banco", { err: dbErr });
  }

  // 2. Consulta instâncias no WAHA via REST com timeout para enriquecimento
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/api/sessions?all=true`, {
      headers: { "X-Api-Key": apiKey },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const sessions = (await res.json()) as Array<{
        name: string;
        status: string;
        me?: { id: string; pushName?: string };
      }>;

      for (const s of sessions) {
        const existing = sessionMap.get(s.name);
        sessionMap.set(s.name, {
          name: s.name,
          status: s.status,
          phone: s.me?.id?.split("@")[0] || existing?.phone,
          pushName: s.me?.pushName || existing?.pushName,
        });
      }
    }
  } catch (err) {
    logger.warn("[custom-chat.waha-dispatcher] Timeout ou erro ao consultar sessões no WAHA", { err });
  }

  const result = Array.from(sessionMap.values());

  logger.info("[waha-dispatcher] Sessões consolidadas (DB + WAHA)", {
    total: result.length,
    working: result.filter((s) => s.status === "WORKING").length,
    sessions: result.map((s) => `${s.name}:${s.status}`),
  });

  return result;
}

/**
 * Exclui instâncias WAHA que não estão com status WORKING.
 * Para a sessão antes de deletar e limpa registros órfãos no banco de dados.
 * Protege instâncias autênticas que possuem telefone registrado.
 */
export async function deleteNonWorkingSessions(): Promise<{ deleted: string[]; errors: string[] }> {
  const baseUrl = process.env.WAHA_API_BASE_URL || "http://localhost:3035";
  const apiKey = process.env.WAHA_API_KEY || "";
  const deleted: string[] = [];
  const errors: string[] = [];

  // Lista de instâncias principais a nunca excluir inadvertidamente
  const protectedNames = new Set(["org_dfbfd2d3", "org_dfbfd2d3_8f3813"]);

  try {
    const sessions = await getActiveWahaSessions();
    // Identifica instâncias fantasmas ou desconectadas:
    // Deleta sessões que não estão WORKING e não são instâncias protegidas com telefone
    const candidates = sessions.filter((s) => {
      if (s.status === "WORKING") return false;
      // Se for protegida e tiver telefone, não apaga (está apenas inicializando/recarregando)
      if (protectedNames.has(s.name) && s.phone) return false;
      return true;
    });

    const admin = createAdminClient();

    for (const session of candidates) {
      try {
        // 1. Tenta parar a sessão antes de deletar (requisito da API WAHA)
        await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(session.name)}/stop`, {
          method: "POST",
          headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).catch(() => {});

        // 2. Deleta a sessão do WAHA
        const res = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(session.name)}`, {
          method: "DELETE",
          headers: { "X-Api-Key": apiKey },
        });

        if (res.ok || res.status === 404 || res.status === 422) {
          deleted.push(session.name);
          logger.info("[waha-dispatcher] Sessão órfã/desconectada removida", { name: session.name, status: session.status });

          // 3. Sincroniza no banco de dados Supabase (remove ou arquiva)
          await admin
            .from("channel_sessions")
            .update({ archived_at: new Date().toISOString(), status: "STOPPED" })
            .eq("waha_session_name", session.name);
        } else {
          errors.push(`${session.name}: HTTP ${res.status}`);
        }
      } catch (err) {
        errors.push(`${session.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    errors.push(`Erro ao listar sessões: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { deleted, errors };
}
