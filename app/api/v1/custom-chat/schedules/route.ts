import { NextRequest, NextResponse } from "next/server";
import {
  listScheduledJobs,
  saveScheduledJob,
  cancelScheduledJob,
  deleteScheduledJob,
  updateScheduledJob,
  ScheduledJob,
  getScheduledJob,
  processDueScheduledJobs,
} from "@/lib/custom-chat/scheduler-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Processa automaticamente agendamentos vencidos a cada leitura
    await processDueScheduledJobs();
    const jobs = listScheduledJobs();
    return NextResponse.json({ ok: true, data: jobs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.title || !body.steps || !body.scheduleTime) {
      return NextResponse.json(
        { ok: false, error: "Campos obrigatórios: title, steps, scheduleTime." },
        { status: 400 },
      );
    }

    const isGroup = body.targetMode === "group";

    if (isGroup && !body.groupChatId) {
      return NextResponse.json(
        { ok: false, error: "No modo grupo, o campo groupChatId é obrigatório." },
        { status: 400 },
      );
    }

    if (!isGroup && (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0)) {
      return NextResponse.json(
        { ok: false, error: "No modo contatos, recipients não pode ser vazio." },
        { status: 400 },
      );
    }

    const newJob: ScheduledJob = {
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: body.title,
      type: body.type || (body.steps.length > 1 ? "sequence" : "single"),
      sessionName: body.sessionName || undefined, // Instância WAHA escolhida
      targetMode: isGroup ? "group" : "contacts",
      groupChatId: isGroup ? (body.groupChatId || undefined) : undefined,
      groupName: isGroup ? (body.groupName || undefined) : undefined,
      steps: body.steps, // Inclui dataUrl das mídias se presentes
      recipients: isGroup ? (body.recipients || []) : body.recipients,
      scheduleTime: body.scheduleTime, // ISO UTC recebido do client (já convertido de BRT→UTC no front)
      createdBy: body.createdBy || "Operador Deskcomm",
      createdAt: new Date().toISOString(),
      status: "scheduled",
    };

    const saved = saveScheduledJob(newJob);

    // Se a data/hora for agora ou retroativa, despacha imediatamente
    if (new Date(newJob.scheduleTime).getTime() <= Date.now()) {
      await processDueScheduledJobs();
    }

    return NextResponse.json({ ok: true, data: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action } = body;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID do agendamento é obrigatório." }, { status: 400 });
    }

    // ── Cancelar ─────────────────────────────────────────────────────────────
    if (action === "cancel") {
      const ok = cancelScheduledJob(id);
      return NextResponse.json({ ok });
    }

    // ── Disparar agora ────────────────────────────────────────────────────────
    if (action === "execute-now") {
      const job = getScheduledJob(id);
      if (!job) {
        return NextResponse.json({ ok: false, error: "Agendamento não encontrado." }, { status: 404 });
      }

      job.scheduleTime = new Date(Date.now() - 1000).toISOString();
      job.status = "scheduled";
      saveScheduledJob(job);
      await processDueScheduledJobs();
      const updated = getScheduledJob(id) || job;
      return NextResponse.json({ ok: true, data: updated });
    }

    // ── Editar agendamento pendente ────────────────────────────────────────────
    if (action === "update") {
      const {
        title,
        steps,
        scheduleTime,
        recipients,
        createdBy,
        sessionName,
        targetMode,
        groupChatId,
        groupName,
      } = body;

      const updated = updateScheduledJob(id, {
        ...(title !== undefined && { title }),
        ...(steps !== undefined && { steps }),
        ...(scheduleTime !== undefined && { scheduleTime }),
        ...(recipients !== undefined && { recipients }),
        ...(createdBy !== undefined && { createdBy }),
        ...(sessionName !== undefined && { sessionName }),
        ...(targetMode !== undefined && { targetMode }),
        ...(groupChatId !== undefined && { groupChatId }),
        ...(groupName !== undefined && { groupName }),
      });

      if (!updated) {
        return NextResponse.json(
          { ok: false, error: "Agendamento não encontrado ou não está em status editável (apenas scheduled)." },
          { status: 409 },
        );
      }

      return NextResponse.json({ ok: true, data: updated });
    }

    return NextResponse.json({ ok: false, error: "Ação não reconhecida." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID do agendamento é obrigatório." }, { status: 400 });
    }

    const ok = deleteScheduledJob(id);
    return NextResponse.json({ ok });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
