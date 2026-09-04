/**
 * Validador Automático de Números WhatsApp (WAHA)
 * Executa sanitização rigorosa no padrão brasileiro e verificação prévia com timeout estrito
 * para garantir rapidez instantânea, evitar travamento e prevenir banimentos.
 */

import { ContactRecipient } from "./spintax";
import { logger } from "@/lib/logger";

export interface ValidationResultItem {
  recipient: ContactRecipient;
  status: "valid" | "invalid" | "malformed";
  chatId?: string;
  motivo?: string;
  checkedAt: string;
}

export interface BatchValidationSummary {
  total: number;
  validCount: number;
  invalidCount: number;
  malformedCount: number;
  results: ValidationResultItem[];
  validRecipients: ContactRecipient[];
}

/**
 * Sanitiza e normaliza telefone para padrão brasileiro:
 * Ex: +55 (31) 97502-3319 -> 5531975023319
 */
export function sanitizeBrazilianPhone(phone: string): {
  cleanDigits: string;
  formatted: string;
  isValidFormat: boolean;
  error?: string;
} {
  const digits = phone.replace(/\D/g, "");

  let normalized = digits;
  if (!normalized.startsWith("55")) {
    if (normalized.length === 10 || normalized.length === 11) {
      normalized = "55" + normalized;
    }
  }

  // No Brasil: 55 + DDD (2 dígitos) + 8 ou 9 dígitos = 12 ou 13 dígitos
  if (normalized.length < 12 || normalized.length > 13) {
    return {
      cleanDigits: normalized,
      formatted: `+${normalized}`,
      isValidFormat: false,
      error: `Quantidade de dígitos inválida (${normalized.length} dígitos). Esperado 12 ou 13 com DDD.`,
    };
  }

  const ddd = parseInt(normalized.substring(2, 4), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) {
    return {
      cleanDigits: normalized,
      formatted: `+${normalized}`,
      isValidFormat: false,
      error: `DDD ${ddd} inválido no Brasil.`,
    };
  }

  return {
    cleanDigits: normalized,
    formatted: `+${normalized}`,
    isValidFormat: true,
  };
}

/**
 * Valida um único número de telefone no WAHA com timeout estrito de 2 segundos.
 * Se o WAHA demorar ou falhar, recorre à validação de sintaxe para nunca travar.
 */
export async function validateSinglePhoneWithWaha(
  session: string,
  phoneDigits: string,
): Promise<{ numberExists: boolean; chatId?: string | null; error?: string }> {
  const baseUrl = process.env.WAHA_API_BASE_URL || "http://localhost:3035";
  const apiKey = process.env.WAHA_API_KEY || "";

  const clean = phoneDigits.replace(/\D/g, "");
  const defaultChatId = `${clean}@c.us`;

  // Timeout estrito de 2 segundos para cada consulta
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const url = new URL(`${baseUrl}/api/contacts/check-exists`);
    url.searchParams.set("session", session);
    url.searchParams.set("phone", clean);

    const res = await fetch(url.toString(), {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        numberExists?: boolean;
        chatId?: string | null;
      };

      if (data && data.numberExists) {
        return {
          numberExists: true,
          chatId: data.chatId || defaultChatId,
        };
      }
    }

    // Se respondeu explicitamente que não existe
    return {
      numberExists: false,
      error: "Número não cadastrado no WhatsApp",
    };
  } catch {
    clearTimeout(timeoutId);
    // Timeout ou erro de rede no check-exists: fallback seguro para sintaxe válida
    logger.info("[validator] Validação WAHA excedeu tempo; aceitando por formato válido", { phone: clean });
    return {
      numberExists: true,
      chatId: defaultChatId,
      error: "Válido por formato (validação rápida)",
    };
  }
}

/**
 * Validação paralela em lotes de 3 contatos para resposta instantânea.
 */
export async function validateBatchRecipients(
  session: string,
  recipients: ContactRecipient[],
  _delayBetweenChecksMs: number = 50,
): Promise<BatchValidationSummary> {
  const results: ValidationResultItem[] = [];
  const validRecipients: ContactRecipient[] = [];

  let validCount = 0;
  let invalidCount = 0;
  let malformedCount = 0;

  // Processa em paralelo com chunks de 3
  const chunkSize = 3;
  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize);

    const chunkPromises = chunk.map(async (r) => {
      const { cleanDigits, formatted, isValidFormat, error } = sanitizeBrazilianPhone(
        r.numeroLimpo || r.numero,
      );

      if (!isValidFormat) {
        return {
          type: "malformed" as const,
          item: {
            recipient: {
              raw: r.raw,
              primeiroNome: r.primeiroNome,
              segundoNome: r.segundoNome,
              nomeCompleto: r.nomeCompleto,
              customTexto: r.customTexto,
              numero: r.numero,
              numeroLimpo: r.numeroLimpo,
              valido: false,
              motivoInvalido: error,
            },
            status: "malformed" as const,
            motivo: error,
            checkedAt: new Date().toISOString(),
          },
        };
      }

      const check = await validateSinglePhoneWithWaha(session, cleanDigits);

      if (check.numberExists && check.chatId) {
        const validRecipient: ContactRecipient = {
          raw: r.raw,
          primeiroNome: r.primeiroNome,
          segundoNome: r.segundoNome,
          nomeCompleto: r.nomeCompleto,
          customTexto: r.customTexto,
          numero: formatted,
          numeroLimpo: cleanDigits,
          chatId: check.chatId,
          valido: true,
        };

        return {
          type: "valid" as const,
          validRecipient,
          item: {
            recipient: validRecipient,
            status: "valid" as const,
            chatId: check.chatId,
            motivo: check.error,
            checkedAt: new Date().toISOString(),
          },
        };
      }

      return {
        type: "invalid" as const,
        item: {
          recipient: {
            raw: r.raw,
            primeiroNome: r.primeiroNome,
            segundoNome: r.segundoNome,
            nomeCompleto: r.nomeCompleto,
            customTexto: r.customTexto,
            numero: r.numero,
            numeroLimpo: r.numeroLimpo,
            valido: false,
            motivoInvalido: check.error || "Número não possui WhatsApp ativo",
          },
          status: "invalid" as const,
          motivo: check.error || "Número não possui WhatsApp ativo",
          checkedAt: new Date().toISOString(),
        },
      };
    });

    const chunkResults = await Promise.all(chunkPromises);

    for (const res of chunkResults) {
      if (res.type === "valid") {
        validCount++;
        validRecipients.push(res.validRecipient);
        results.push(res.item);
      } else if (res.type === "malformed") {
        malformedCount++;
        results.push(res.item);
      } else {
        invalidCount++;
        results.push(res.item);
      }
    }
  }

  return {
    total: recipients.length,
    validCount,
    invalidCount,
    malformedCount,
    results,
    validRecipients,
  };
}
