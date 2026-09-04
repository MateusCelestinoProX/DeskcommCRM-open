import { NextResponse } from "next/server";
import { getActiveWahaSessions, deleteNonWorkingSessions } from "@/lib/custom-chat/waha-dispatcher";

/**
 * GET /api/v1/custom-chat/sessions
 * Lista todas as sessões WAHA (incluindo não-WORKING via all=true).
 */
export async function GET() {
  try {
    const sessions = await getActiveWahaSessions();
    const working = sessions.filter((s) => s.status === "WORKING");
    return NextResponse.json({
      ok: true,
      data: sessions,
      working: working.length,
      total: sessions.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/custom-chat/sessions
 * Remove todas as instâncias que NÃO estão com status WORKING.
 * Isso limpa sessões corrompidas, órfãs ou em estado STARTING/SCAN_QR_CODE.
 */
export async function DELETE() {
  try {
    const result = await deleteNonWorkingSessions();
    return NextResponse.json({
      ok: true,
      data: result,
      message: result.deleted.length > 0
        ? `${result.deleted.length} instância(s) não-conectada(s) removida(s): ${result.deleted.join(", ")}`
        : "Nenhuma instância não-conectada encontrada para remover.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
