import { NextRequest, NextResponse } from "next/server";
import { parseContactRecipients, ContactRecipient } from "@/lib/custom-chat/spintax";
import { validateBatchRecipients } from "@/lib/custom-chat/validator";
import { getActiveWahaSessions } from "@/lib/custom-chat/waha-dispatcher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let recipients: ContactRecipient[] = [];

    if (Array.isArray(body.recipients) && body.recipients.length > 0) {
      recipients = body.recipients;
    } else if (typeof body.rawText === "string" && body.rawText.trim().length > 0) {
      recipients = parseContactRecipients(body.rawText);
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nenhum número ou contato válido para validação." },
        { status: 400 },
      );
    }

    // Resolve a sessão do WAHA
    let session = body.session;
    if (!session) {
      const activeSessions = await getActiveWahaSessions();
      const working = activeSessions.find((s) => s.status === "WORKING") || activeSessions[0];
      session = working?.name || "org_dfbfd2d3";
    }

    // Delay de segurança entre requisições de validação para não estressar o socket
    const delayMs = typeof body.delayMs === "number" ? body.delayMs : 250;

    const summary = await validateBatchRecipients(session, recipients, delayMs);

    return NextResponse.json({ ok: true, data: summary, sessionUsed: session });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
