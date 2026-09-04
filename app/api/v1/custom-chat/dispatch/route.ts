import { NextRequest, NextResponse } from "next/server";
import { generateUniqueMessage, ContactRecipient } from "@/lib/custom-chat/spintax";
import {
  sendViaWaha,
  MediaAttachment,
  getActiveWahaSessions,
} from "@/lib/custom-chat/waha-dispatcher";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "send-single" } = body;

    // Resolve sessão — prioriza WORKING, fallback para qualquer sessão, último recurso é o default
    let session = body.session;
    if (!session) {
      const activeSessions = await getActiveWahaSessions();
      const working = activeSessions.find((s) => s.status === "WORKING");
      const any = activeSessions[0];
      session = working?.name || any?.name || "org_dfbfd2d3";

      if (!working && activeSessions.length > 0) {
        logger.warn("[dispatch] Nenhuma sessão WORKING — usando primeira disponível", {
          session,
          status: any?.status,
        });
      } else if (activeSessions.length === 0) {
        logger.warn("[dispatch] Nenhuma sessão WAHA encontrada — usando fallback org_dfbfd2d3");
      }
    }

    if (action === "send-single") {
      const recipient = body.recipient as ContactRecipient;
      const template = body.template as string | undefined;
      const directText = body.text as string | undefined;
      const media = body.media as MediaAttachment | undefined;
      const simulateTyping = body.simulateTyping !== false;

      if (!recipient) {
        return NextResponse.json(
          { ok: false, error: "Destinatário inválido para envio." },
          { status: 400 },
        );
      }

      let rawClean = recipient.numeroLimpo || (recipient.numero ? recipient.numero.replace(/\D/g, "") : "");
      if (rawClean && !rawClean.startsWith("55") && (rawClean.length === 10 || rawClean.length === 11)) {
        rawClean = `55${rawClean}`;
      }

      const chatId = recipient.chatId || (rawClean ? `${rawClean}@c.us` : "");

      if (!chatId) {
        return NextResponse.json(
          { ok: false, error: "Número de telefone ou chatId não fornecido." },
          { status: 400 },
        );
      }

      const uniqueText = directText || (template ? generateUniqueMessage(template, recipient) : undefined);

      logger.info("[dispatch] Enviando mensagem via WAHA", {
        session,
        chatId,
        hasText: !!uniqueText,
        hasMedia: !!media,
        mediaType: media?.type,
        hasDataUrl: !!(media?.dataUrl || media?.data),
        hasUrl: !!media?.url,
        simulateTyping,
      });

      const result = await sendViaWaha({
        session,
        chatId,
        text: uniqueText,
        media,
        simulateTyping,
      });

      if (!result.success) {
        logger.warn("[dispatch] Falha no envio via WAHA", {
          session,
          chatId,
          error: result.error,
          isTimelock: result.isTimelock,
          isCapping: result.isCapping,
        });
      } else {
        logger.info("[dispatch] Mensagem enviada com sucesso via WAHA", {
          session,
          chatId,
          messageId: result.messageId,
        });
      }

      return NextResponse.json({
        ok: result.success,
        data: {
          result,
          renderedText: uniqueText,
          chatId,
          recipient,
          session,
        },
        // Inclui o erro na raiz também para fácil detecção no cliente
        ...(result.success ? {} : { error: result.error }),
      });
    }

    return NextResponse.json({ ok: false, error: "Ação não suportada." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[dispatch] Exceção não tratada", { err });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
