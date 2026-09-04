/**
 * GET/POST /api/v1/custom-chat/schedules/tick
 *
 * Endpoint de processamento periódico de agendamentos vencidos.
 * Chamado pelo container `scheduler` (ou qualquer cron externo) a cada minuto.
 *
 * Auth: header `X-Internal-Secret: <INTERNAL_SECRET>` ou sem auth em dev.
 */
import { NextRequest, NextResponse } from "next/server";
import { processDueScheduledJobs } from "@/lib/custom-chat/scheduler-store";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos — sequências longas precisam de tempo

async function handle(req: NextRequest): Promise<Response> {
  // Auth opcional — verifica INTERNAL_SECRET se configurado
  const secret = process.env.INTERNAL_SECRET;
  if (secret) {
    const provided =
      req.headers.get("x-internal-secret") ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    if (provided !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  logger.info("[custom-chat.tick] Iniciando processamento de agendamentos vencidos");

  try {
    const { executedCount } = await processDueScheduledJobs();
    const elapsed = Date.now() - startedAt;

    logger.info("[custom-chat.tick] Concluído", { executedCount, elapsedMs: elapsed });

    return NextResponse.json({
      ok: true,
      executedCount,
      elapsedMs: elapsed,
      processedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[custom-chat.tick] Erro ao processar agendamentos", { err });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
