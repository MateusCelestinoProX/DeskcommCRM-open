import { NextRequest, NextResponse } from "next/server";
import { getWahaGroups } from "@/lib/custom-chat/waha-dispatcher";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/custom-chat/groups?session=NOME_DA_SESSAO
 *
 * Retorna todos os grupos WhatsApp disponíveis para a sessão informada.
 * Usado pelo DisparadorView e AgendadorView no modo grupo.
 *
 * Query params:
 *   session (obrigatório) — nome da sessão WAHA
 *
 * Resposta:
 *   { ok: true, data: WahaGroupInfo[], total: number }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session");

    if (!session || session.trim() === "") {
      return NextResponse.json(
        { ok: false, error: "Parâmetro \"session\" é obrigatório." },
        { status: 400 }
      );
    }

    const groups = await getWahaGroups(session.trim());

    return NextResponse.json({
      ok: true,
      data: groups,
      total: groups.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
