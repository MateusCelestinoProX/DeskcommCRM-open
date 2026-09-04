/**
 * Armazenamento e Orquestração de Agendamentos e Sequências
 * Gerencia mensagens programadas e sequências com persistência em disco JSON e motor de execução em background.
 */

import fs from "node:fs";
import path from "node:path";
import { ContactRecipient, generateUniqueMessage } from "./spintax";
import { MediaAttachment, sendViaWaha, getActiveWahaSessions } from "./waha-dispatcher";
import { logger } from "@/lib/logger";

export interface ScheduleStep {
  stepNumber: number;
  text: string;
  media?: MediaAttachment;
  delayAfterSeconds?: number;
}

export interface ScheduledJob {
  id: string;
  title: string;
  type: "single" | "sequence";
  sessionName?: string; // Instância WAHA escolhida para o envio
  steps: ScheduleStep[];
  recipients: ContactRecipient[];
  scheduleTime: string; // ISO string
  createdBy: string;
  createdAt: string;
  status: "scheduled" | "running" | "completed" | "failed" | "cancelled";
  completedAt?: string;
  logs?: Array<{
    timestamp: string;
    recipientPhone: string;
    status: "sent" | "error";
    detail?: string;
  }>;
}

// Armazenamento em memória com sincronização com disco
let globalScheduleStore: Map<string, ScheduledJob> = new Map();
let isInitialized = false;
let isProcessingSchedules = false;

function getStorageFilePath(): string {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "custom-chat");
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch {
      // fallback
    }
  }
  return path.join(uploadsDir, "schedules.json");
}

function loadSchedulesFromDisk(): void {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const list = JSON.parse(content) as ScheduledJob[];
      globalScheduleStore.clear();
      for (const item of list) {
        globalScheduleStore.set(item.id, item);
      }
      return;
    }
  } catch (err) {
    logger.warn("[scheduler-store] Falha ao ler agendamentos do disco", { err });
  }

}

function saveSchedulesToDisk(): void {
  try {
    const filePath = getStorageFilePath();
    const list = Array.from(globalScheduleStore.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    logger.warn("[scheduler-store] Falha ao salvar agendamentos no disco", { err });
  }
}

let bgTimer: NodeJS.Timeout | null = null;

function ensureInitialized() {
  loadSchedulesFromDisk();
  isInitialized = true;

  if (!bgTimer && typeof setInterval !== "undefined") {
    bgTimer = setInterval(() => {
      processDueScheduledJobs().catch((err) => {
        logger.warn("[scheduler-store] Falha no heartbeat interno:", { err });
      });
    }, 5000); // Heartbeat interno a cada 5 segundos
    if (bgTimer.unref) bgTimer.unref();
  }
}

export function listScheduledJobs(): ScheduledJob[] {
  ensureInitialized();
  return Array.from(globalScheduleStore.values()).sort(
    (a, b) => new Date(a.scheduleTime).getTime() - new Date(b.scheduleTime).getTime(),
  );
}

export function getScheduledJob(id: string): ScheduledJob | null {
  ensureInitialized();
  return globalScheduleStore.get(id) ?? null;
}

export function saveScheduledJob(job: ScheduledJob): ScheduledJob {
  ensureInitialized();
  globalScheduleStore.set(job.id, job);
  saveSchedulesToDisk();
  return job;
}

export function cancelScheduledJob(id: string): boolean {
  ensureInitialized();
  const job = globalScheduleStore.get(id);
  if (!job) return false;
  job.status = "cancelled";
  globalScheduleStore.set(id, job);
  saveSchedulesToDisk();
  return true;
}

export function deleteScheduledJob(id: string): boolean {
  ensureInitialized();
  const deleted = globalScheduleStore.delete(id);
  if (deleted) {
    saveSchedulesToDisk();
  }
  return deleted;
}

/**
 * Atualiza um agendamento PENDENTE (status === "scheduled").
 * Permite editar: title, steps, scheduleTime, recipients, createdBy.
 * Retorna null se o job não existir ou não estiver em status editável.
 */
export function updateScheduledJob(
  id: string,
  updates: Partial<Pick<ScheduledJob, "title" | "steps" | "scheduleTime" | "recipients" | "createdBy" | "sessionName">>,
): ScheduledJob | null {
  ensureInitialized();
  const job = globalScheduleStore.get(id);
  if (!job) return null;
  if (job.status !== "scheduled") return null; // Só edita pendentes

  const updated: ScheduledJob = {
    ...job,
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.steps !== undefined && { steps: updates.steps }),
    ...(updates.scheduleTime !== undefined && { scheduleTime: updates.scheduleTime }),
    ...(updates.recipients !== undefined && { recipients: updates.recipients }),
    ...(updates.createdBy !== undefined && { createdBy: updates.createdBy }),
    ...(updates.sessionName !== undefined && { sessionName: updates.sessionName }),
    // Recalcula type ao editar steps
    type: (updates.steps ?? job.steps).length > 1 ? "sequence" : "single",
  };

  globalScheduleStore.set(id, updated);
  saveSchedulesToDisk();
  return updated;
}


/**
 * Motor de Execução em Segundo Plano:
 * Verifica e executa automaticamente todos os agendamentos vencidos (scheduleTime <= now)
 */
export async function processDueScheduledJobs(): Promise<{ executedCount: number }> {
  ensureInitialized();
  if (isProcessingSchedules) {
    return { executedCount: 0 };
  }

  isProcessingSchedules = true;
  let executedCount = 0;

  try {
    const now = Date.now();
    const allJobs = Array.from(globalScheduleStore.values());
    const dueJobs = allJobs.filter(
      (j) => j.status === "scheduled" && new Date(j.scheduleTime).getTime() <= now,
    );

    if (dueJobs.length === 0) {
      return { executedCount: 0 };
    }

    // Obtém sessões ativas do WAHA para validação e fallback
    const activeSessions = await getActiveWahaSessions().catch(() => []);
    const workingSession = activeSessions.find((s) => s.status === "WORKING") || activeSessions[0];
    const defaultSession = workingSession?.name || "org_dfbfd2d3";

    for (const job of dueJobs) {
      // Instância escolhida pelo usuário para este agendamento (ou default WORKING se omitida)
      let targetSession = job.sessionName;
      if (!targetSession || !activeSessions.some((s) => s.name === targetSession)) {
        targetSession = defaultSession;
      }

      job.status = "running";
      saveScheduledJob(job);

      const logs: Array<{
        timestamp: string;
        recipientPhone: string;
        status: "sent" | "error";
        detail?: string;
      }> = [];

      for (const recipient of job.recipients) {
        for (let sIdx = 0; sIdx < job.steps.length; sIdx++) {
          const step = job.steps[sIdx];
          if (!step) continue;

          const text = step.text ? generateUniqueMessage(step.text, recipient) : undefined;
          const media = step.media;

          let rawClean = recipient.numeroLimpo || (recipient.numero ? recipient.numero.replace(/\D/g, "") : "");
          if (rawClean && !rawClean.startsWith("55") && (rawClean.length === 10 || rawClean.length === 11)) {
            rawClean = `55${rawClean}`;
          }
          const chatId = recipient.chatId || (rawClean ? `${rawClean}@c.us` : "");

          try {
            const result = await sendViaWaha({
              session: targetSession,
              chatId,
              text,
              media,
              simulateTyping: true,
            });

            logs.push({
              timestamp: new Date().toISOString(),
              recipientPhone: recipient.numeroLimpo || recipient.numero,
              status: result.success ? "sent" : "error",
              detail: result.success
                ? `Entregue via WAHA (ID: ${result.messageId || "ok"})`
                : (result.error || "Falha no envio"),
            });
          } catch (err: unknown) {
            logs.push({
              timestamp: new Date().toISOString(),
              recipientPhone: recipient.numeroLimpo || recipient.numero,
              status: "error",
              detail: err instanceof Error ? err.message : "Erro desconhecido",
            });
          }

          // Delay entre etapas se houver mais de uma etapa
          if (sIdx < job.steps.length - 1 && step.delayAfterSeconds && step.delayAfterSeconds > 0) {
            // Teto de segurança de 30 minutos (1800s) para delays muito longos em sequências
            const safeDelay = Math.min(step.delayAfterSeconds, 1800);
            logger.info("[scheduler-store] Aguardando delay entre etapas", {
              jobId: job.id,
              stepIndex: sIdx,
              delaySeconds: safeDelay,
            });
            await new Promise((r) => setTimeout(r, safeDelay * 1000));
          }
        }
      }

      job.status = "completed";
      job.completedAt = new Date().toISOString();
      job.logs = logs;
      saveScheduledJob(job);
      executedCount++;
    }
  } catch (err) {
    logger.error("[scheduler-store] Erro ao processar agendamentos vencidos", { err });
  } finally {
    isProcessingSchedules = false;
  }

  return { executedCount };
}
