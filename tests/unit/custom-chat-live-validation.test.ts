import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  sendViaWaha,
  resolveTargetChatId,
  convertToOggOpusBuffer,
  toPureBase64,
  getActiveWahaSessions,
} from "@/lib/custom-chat/waha-dispatcher";
import {
  saveScheduledJob,
  getScheduledJob,
  processDueScheduledJobs,
  ScheduledJob,
} from "@/lib/custom-chat/scheduler-store";

describe("Validação E2E Custom Chat & WAHA", () => {
  it("resolve TargetChatId para número de teste 31998622489", async () => {
    const baseUrl = process.env.WAHA_API_BASE_URL || "http://localhost:3035";
    const apiKey = process.env.WAHA_API_KEY || "waha_b73518c18cd4fbae53b311e72c385525";
    const target = await resolveTargetChatId(baseUrl, apiKey, "org_dfbfd2d3", "31998622489");
    expect(target).toBeDefined();
    expect(target.endsWith("@c.us")).toBe(true);
  });

  it("converte e valida buffer de áudio OGG Opus com ffmpeg", async () => {
    const testAudioPath = path.join(process.cwd(), "public", "uploads", "custom-chat", "test_voice.ogg");
    if (fs.existsSync(testAudioPath)) {
      const buf = fs.readFileSync(testAudioPath);
      const converted = await convertToOggOpusBuffer(buf);
      expect(converted.length).toBeGreaterThan(0);
      expect(converted.subarray(0, 4).toString("ascii")).toBe("OggS");
    }
  });

  it("limpa prefixos data URL para gerar Base64 puro", () => {
    const raw = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA";
    const pure = toPureBase64(raw);
    expect(pure).toBe("iVBORw0KGgoAAAANSUhEUgAA");
  });

  it("executa agendamento vencido automaticamente via processDueScheduledJobs", async () => {
    const testJob: ScheduledJob = {
      id: `test_job_${Date.now()}`,
      title: "Teste de Agendamento Automático",
      type: "single",
      steps: [
        {
          stepNumber: 1,
          text: "Mensagem automática de teste agendado",
        },
      ],
      recipients: [
        {
          raw: "Teste 31998622489",
          primeiroNome: "Rafael",
          numero: "31998622489",
          numeroLimpo: "5531998622489",
          valido: true,
        },
      ],
      scheduleTime: new Date(Date.now() - 5000).toISOString(), // Venceu há 5 segundos
      createdBy: "Sistema de Teste",
      createdAt: new Date().toISOString(),
      status: "scheduled",
    };

    saveScheduledJob(testJob);

    const res = await processDueScheduledJobs();
    expect(res.executedCount).toBeGreaterThanOrEqual(1);

    const updated = getScheduledJob(testJob.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.completedAt).toBeDefined();
    expect(updated?.logs && updated.logs.length > 0).toBe(true);
  });
});
