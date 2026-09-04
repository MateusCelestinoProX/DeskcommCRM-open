import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const WAHA_BASE = process.env.WAHA_API_BASE_URL || "http://waha:3000";
const WAHA_KEY = process.env.WAHA_API_KEY || "";

async function wahaFetch(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${WAHA_BASE}${path}`, {
    method,
    headers: { "X-Api-Key": WAHA_KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * GET /api/v1/waha/manage
 * Lista TODAS as sessões (all=true).
 */
export async function GET() {
  try {
    const { ok, data, status } = await wahaFetch("/api/sessions?all=true");
    if (!ok) {
      return NextResponse.json({ ok: false, error: `WAHA retornou HTTP ${status}` }, { status: 502 });
    }
    const sessions = Array.isArray(data) ? data : [];
    return NextResponse.json({
      ok: true,
      data: sessions,
      working: sessions.filter((s: { status: string }) => s.status === "WORKING").length,
      total: sessions.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[waha/manage] Falha ao listar sessões", { err });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/v1/waha/manage
 * Ações: create-session | stop-session | delete-session | delete-all | get-qr
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, session } = body as { action: string; session?: string };

    // ─── Criar nova sessão e retornar QR code ──────────────────────────────
    if (action === "create-session") {
      const sessionName = session || `sess_${Date.now()}`;

      // 1. Cria a sessão
      const create = await wahaFetch("/api/sessions", "POST", {
        name: sessionName,
        config: {
          debug: false,
          noweb: { store: { enabled: true, fullSync: false } },
        },
      });

      if (!create.ok && create.status !== 422) {
        return NextResponse.json(
          { ok: false, error: `Falha ao criar sessão: HTTP ${create.status}` },
          { status: 502 },
        );
      }

      // 2. Inicia a sessão
      await wahaFetch(`/api/sessions/${encodeURIComponent(sessionName)}/start`, "POST", {});

      // 3. Aguarda o QR estar disponível (até 15s)
      let qrData: { value?: string; imageBase64?: string } | null = null;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const qrRes = await wahaFetch(`/api/sessions/${encodeURIComponent(sessionName)}/auth/qr`);
        if (qrRes.ok && qrRes.data) {
          qrData = qrRes.data as { value?: string; imageBase64?: string };
          if (qrData.imageBase64 || qrData.value) break;
        }
      }

      logger.info("[waha/manage] Nova sessão criada", { sessionName });

      return NextResponse.json({
        ok: true,
        session: sessionName,
        qr: qrData,
        message: qrData ? "QR Code pronto para escanear" : "Sessão criada, QR ainda carregando",
      });
    }

    // ─── Buscar QR de sessão existente ────────────────────────────────────
    if (action === "get-qr") {
      if (!session) {
        return NextResponse.json({ ok: false, error: "Informe o nome da sessão." }, { status: 400 });
      }
      const qrRes = await wahaFetch(`/api/sessions/${encodeURIComponent(session)}/auth/qr`);
      return NextResponse.json({ ok: qrRes.ok, qr: qrRes.data, session });
    }

    // ─── Parar sessão ─────────────────────────────────────────────────────
    if (action === "stop-session") {
      if (!session) return NextResponse.json({ ok: false, error: "Informe o nome da sessão." }, { status: 400 });
      const r = await wahaFetch(`/api/sessions/${encodeURIComponent(session)}/stop`, "POST", {});
      logger.info("[waha/manage] Sessão parada", { session });
      return NextResponse.json({ ok: r.ok || r.status === 404, data: r.data });
    }

    // ─── Deletar sessão específica ─────────────────────────────────────────
    if (action === "delete-session") {
      if (!session) return NextResponse.json({ ok: false, error: "Informe o nome da sessão." }, { status: 400 });

      // Para antes de deletar
      await wahaFetch(`/api/sessions/${encodeURIComponent(session)}/stop`, "POST", {});
      await new Promise((r) => setTimeout(r, 800));

      const r = await wahaFetch(`/api/sessions/${encodeURIComponent(session)}`, "DELETE");
      logger.info("[waha/manage] Sessão deletada", { session });
      return NextResponse.json({ ok: r.ok || r.status === 404, data: r.data });
    }

    // ─── Deletar TODAS as sessões ──────────────────────────────────────────
    if (action === "delete-all") {
      const listRes = await wahaFetch("/api/sessions?all=true");
      const sessions = Array.isArray(listRes.data) ? listRes.data : [];
      const results: Array<{ name: string; stopped: boolean; deleted: boolean }> = [];

      for (const s of sessions as Array<{ name: string }>) {
        // Para
        const stop = await wahaFetch(`/api/sessions/${encodeURIComponent(s.name)}/stop`, "POST", {});
        await new Promise((r) => setTimeout(r, 600));

        // Deleta
        const del = await wahaFetch(`/api/sessions/${encodeURIComponent(s.name)}`, "DELETE");

        results.push({
          name: s.name,
          stopped: stop.ok || stop.status === 404,
          deleted: del.ok || del.status === 404,
        });

        logger.info("[waha/manage] Sessão removida no delete-all", { name: s.name });
        await new Promise((r) => setTimeout(r, 300));
      }

      // Confirma que ficou vazio
      const afterList = await wahaFetch("/api/sessions?all=true");
      const remaining = Array.isArray(afterList.data) ? afterList.data.length : "?";

      return NextResponse.json({
        ok: true,
        results,
        remaining,
        message:
          results.length === 0
            ? "Nenhuma sessão encontrada para remover."
            : `${results.length} sessão(ões) removida(s). Restantes: ${remaining}`,
      });
    }

    return NextResponse.json({ ok: false, error: "Ação não reconhecida." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[waha/manage] Exceção", { err });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
