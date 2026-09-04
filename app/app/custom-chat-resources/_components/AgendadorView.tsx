"use client";

import * as React from "react";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarBlank,
  Clock,
  Plus,
  Trash,
  CheckCircle,
  PaperPlaneTilt,
  ShieldCheck,
  Play,
  X,
  ListChecks,
  ArrowsClockwise,
  Lightning,
  Phone,
  Microphone,
  Warning,
  FolderSimple,
  PencilSimple,
} from "@/lib/ui/icons";

// ─── Helpers de Fuso Horário de Brasília (America/Sao_Paulo, UTC-3) ───────
/** Retorna string YYYY-MM-DDTHH:mm no fuso de Brasília, pronto para datetime-local */
function toBRTLocal(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
}

/** Converte string datetime-local (interpretada explicitamente como horário de Brasília = UTC-3) para ISO UTC */
function brtLocalToUTC(localStr: string): string {
  if (!localStr) return new Date().toISOString();
  if (localStr.includes("Z") || localStr.includes("+") || (localStr.length > 19 && localStr.includes("-", 10))) {
    return new Date(localStr).toISOString();
  }
  // Normaliza para formato YYYY-MM-DDTHH:mm:00-03:00 de Brasília
  const normalized = localStr.length === 16 ? `${localStr}:00-03:00` : `${localStr}-03:00`;
  return new Date(normalized).toISOString();
}

/** Retorna data em BRT somando minutos ao momento atual */
function addMinutesToBRT(minutes: number): string {
  return toBRTLocal(new Date(Date.now() + minutes * 60 * 1000));
}

/** Retorna string para amanhã em BRT no horário especificado (padrão: 09:00) */
function setTomorrowBRT(hour = 9, minute = 0): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dateStr = toBRTLocal(tomorrow).slice(0, 10);
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${dateStr}T${h}:${m}`;
}

/** Formata data ISO em string legível no fuso de Brasília */
function formatBRT(isoStr: string): string {
  return new Date(isoStr).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
import { parseContactRecipients, ContactRecipient, generateUniqueMessage } from "@/lib/custom-chat/spintax";
import { ScheduledJob, ScheduleStep } from "@/lib/custom-chat/scheduler-store";
import { ValidadorModal } from "./ValidadorModal";
import { WhatsAppChatPreview } from "./WhatsAppChatPreview";
import { MediaAttachment } from "@/lib/custom-chat/waha-dispatcher";

interface AgendadorViewProps {
  sessionName: string;
  sessionPhone?: string;
  availableSessions?: Array<{
    name: string;
    status: string;
    phone?: string;
    pushName?: string;
  }>;
  onSelectSession?: (name: string) => void;
  selectedMediaFromLibrary?: MediaAttachment;
  onOpenMediaLibrary?: () => void;
}

export function AgendadorView({
  sessionName,
  sessionPhone,
  availableSessions,
  onSelectSession,
  selectedMediaFromLibrary,
  onOpenMediaLibrary,
}: AgendadorViewProps) {
  const t = useT();
  const [activeTab, setActiveTab] = React.useState<"dashboard" | "create">("dashboard");
  const [jobs, setJobs] = React.useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // ── Relógio BRT em tempo real ──────────────────────────────────────────────
  const [brtClock, setBrtClock] = React.useState<string>(() =>
    new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  );
  React.useEffect(() => {
    const tick = setInterval(() => {
      setBrtClock(
        new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Estado do Modal de Edição ─────────────────────────────────────────────
  const [editingJob, setEditingJob] = React.useState<ScheduledJob | null>(null);
  const [editTitle, setEditTitle] = React.useState<string>("");
  const [editSession, setEditSession] = React.useState<string>("");
  const [editDate, setEditDate] = React.useState<string>("");
  const [editRecipients, setEditRecipients] = React.useState<string>("");
  const [editSteps, setEditSteps] = React.useState<ScheduleStep[]>([]);
  const [isSavingEdit, setIsSavingEdit] = React.useState<boolean>(false);

  const openEditModal = (job: ScheduledJob) => {
    setEditingJob(job);
    setEditTitle(job.title);
    setEditSession(job.sessionName || sessionName);
    setEditDate(toBRTLocal(new Date(job.scheduleTime)));
    setEditRecipients(job.recipients.map((r) => [
      [r.primeiroNome, r.segundoNome].filter(Boolean).join("/"),
      r.customTexto,
      r.numero || r.numeroLimpo,
    ].filter(Boolean).join(", ")).join("\n"));
    setEditSteps(job.steps.map((s) => ({ ...s })));
  };

  const handleConfirmEdit = async () => {
    if (!editingJob) return;
    setIsSavingEdit(true);
    try {
      const scheduleTimeUTC = brtLocalToUTC(editDate);
      const res = await fetch("/api/v1/custom-chat/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingJob.id,
          action: "update",
          title: editTitle,
          sessionName: editSession,
          scheduleTime: scheduleTimeUTC,
          steps: editSteps,
          recipients: editingJob.recipients,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setEditingJob(null);
        await fetchJobs();
      } else {
        alert(json.error || t("Falha ao salvar edição."));
      }
    } catch {
      alert(t("Erro de conexão ao salvar edição."));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Formulário de Criação
  const [title, setTitle] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deskcomm_agendador_title");
      if (saved) return saved;
    }
    return "Sequência de Ativação de Leads";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deskcomm_agendador_title", title);
    }
  }, [title]);

  const [scheduleDate, setScheduleDate] = React.useState<string>(() => addMinutesToBRT(1));
  const [createdBy, setCreatedBy] = React.useState<string>("Atendente Deskcomm");
  const [jobSession, setJobSession] = React.useState<string>(sessionName);
  // Rastreia se o usuário já escolheu manualmente uma sessão para o job
  const jobSessionManuallySetRef = React.useRef(false);

  // Só sincroniza com a sessão global enquanto o usuário NÃO tiver escolhido manualmente
  React.useEffect(() => {
    if (sessionName && !jobSessionManuallySetRef.current) {
      setJobSession(sessionName);
    }
  }, [sessionName]);

  // Handler que marca que o usuário escolheu manualmente
  const handleJobSessionChange = (newSession: string) => {
    jobSessionManuallySetRef.current = true;
    setJobSession(newSession);
  };

  const [rawRecipients, setRawRecipients] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deskcomm_agendador_raw_recipients");
      if (saved !== null) return saved;
    }
    return "Carlos/Eduardo/Carlos Eduardo, VIP +553175023319\nFernanda/Lima, Parceria +5511999998888";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deskcomm_agendador_raw_recipients", rawRecipients);
    }
  }, [rawRecipients]);

  // Etapas da Sequência (padrão: 1 etapa limpa - Mensagem Única)
  const [steps, setSteps] = React.useState<ScheduleStep[]>([
    {
      stepNumber: 1,
      text: "{Olá|Oi} {primeiro_nome}, {tudo bem?|como vai?} Passando para compartilhar uma novidade exclusiva com você.",
      delayAfterSeconds: 0,
    },
  ]);

  // Etapa ativa para visualização no WhatsApp Preview
  const [previewStepIndex, setPreviewStepIndex] = React.useState<number>(0);

  // Slot de Teste do Agendador (Padrão: 31998622489)
  const [testNumber, setTestNumber] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deskcomm_agendador_test_number");
      if (saved) return saved;
    }
    return "31998622489";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deskcomm_agendador_test_number", testNumber);
    }
  }, [testNumber]);

  const [testName, setTestName] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deskcomm_agendador_test_name");
      if (saved) return saved;
    }
    return "Gestor Teste";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deskcomm_agendador_test_name", testName);
    }
  }, [testName]);

  const [isSendingTest, setIsSendingTest] = React.useState<boolean>(false);
  const [testFeedback, setTestFeedback] = React.useState<{
    success?: boolean;
    message: string;
  } | null>(null);

  // Validador Modal
  const [validatorOpen, setValidatorOpen] = React.useState<boolean>(false);
  const [parsedList, setParsedList] = React.useState<ContactRecipient[]>([]);

  // Carregar lista de agendamentos com suporte a modo silencioso para polling
  const fetchJobs = React.useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/v1/custom-chat/schedules");
      const json = await res.json();
      if (json.ok) {
        setJobs(json.data);
      }
    } catch {
      // Falha silenciosa
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchJobs();
    // Auto-refresh silencioso a cada 4 segundos para atualizar status de envio em tempo real
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchJobs({ silent: true });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  // Adicionar etapa na sequência
  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        text: "",
        delayAfterSeconds: 120,
      },
    ]);
    setPreviewStepIndex(steps.length);
  };

  // Remover etapa
  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((step, idx) => ({ ...step, stepNumber: idx + 1 })),
    );
    if (previewStepIndex >= steps.length - 1) {
      setPreviewStepIndex(Math.max(0, steps.length - 2));
    }
  };

  // Alterar texto da etapa
  const handleStepTextChange = (index: number, text: string) => {
    setSteps((prev) => {
      const copy = [...prev];
      const current = copy[index];
      if (current) {
        copy[index] = { ...current, text, stepNumber: index + 1 };
      }
      return copy;
    });
  };

  // Alterar delay da etapa
  const handleStepDelayChange = (index: number, delaySeconds: number) => {
    setSteps((prev) => {
      const copy = [...prev];
      const current = copy[index];
      if (current) {
        copy[index] = { ...current, delayAfterSeconds: delaySeconds, stepNumber: index + 1 };
      }
      return copy;
    });
  };

  // Quando uma mídia da biblioteca é selecionada para o agendador, anexa na etapa ativa
  React.useEffect(() => {
    if (selectedMediaFromLibrary) {
      setSteps((prev) => {
        const copy = [...prev];
        const idx = previewStepIndex;
        const current = copy[idx] || copy[0];
        if (current) {
          copy[idx] = {
            ...current,
            media: {
              type: selectedMediaFromLibrary.type,
              url: selectedMediaFromLibrary.url,
              dataUrl: selectedMediaFromLibrary.dataUrl,
              filename: selectedMediaFromLibrary.filename || (selectedMediaFromLibrary.type === "audio" ? "voice.ogg" : "anexo"),
              isRecordedVoice: selectedMediaFromLibrary.type === "audio",
            },
          };
        }
        return copy;
      });
    }
  }, [selectedMediaFromLibrary, previewStepIndex]);

  // Upload rápido de arquivo de mídia para a etapa (áudio é sempre PTT)
  const handleStepMediaUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: "image" | "audio" | "video" | "document" = "document";
    if (file.type.startsWith("image/")) type = "image";
    else if (file.type.startsWith("audio/")) type = "audio";
    else if (file.type.startsWith("video/")) type = "video";

    // Pré-visualização instantânea local (zero espera de rede)
    const localBlobUrl = URL.createObjectURL(file);
    setSteps((prev) => {
      const copy = [...prev];
      const current = copy[index];
      if (current) {
        copy[index] = {
          ...current,
          media: {
            type,
            url: localBlobUrl,
            filename: file.name,
            isRecordedVoice: type === "audio",
          },
        };
      }
      return copy;
    });

    // Converte para Base64 DataURL
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setSteps((prev) => {
        const copy = [...prev];
        const current = copy[index];
        if (current && current.media) {
          copy[index] = {
            ...current,
            media: {
              ...current.media,
              dataUrl: b64,
            },
          };
        }
        return copy;
      });
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("name", file.name);
    if (type === "audio") formData.append("isRecordedVoice", "true");

    try {
      const res = await fetch("/api/v1/custom-chat/media", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setSteps((prev) => {
          const copy = [...prev];
          const current = copy[index];
          if (current) {
            copy[index] = {
              ...current,
              media: {
                type,
                url: json.data.url,
                dataUrl: json.data.dataUrl || current.media?.dataUrl,
                filename: file.name,
                isRecordedVoice: type === "audio",
              },
            };
          }
          return copy;
        });
      }
    } catch {
      // Preview local já assegurado
    }
  };

  // Destinatário do teste modelado
  const testContactRecipient = React.useMemo<ContactRecipient>(() => {
    const clean = testNumber.replace(/\D/g, "");
    return {
      raw: testNumber,
      primeiroNome: testName.split(" ")[0] || "Teste",
      segundoNome: testName.split(" ").slice(1).join(" ") || "",
      nomeCompleto: testName,
      customTexto: "Slot Teste Agendador",
      numero: clean,
      numeroLimpo: clean,
      numeroFormatado: `+55 ${clean.slice(-11, -9)} ${clean.slice(-9, -4)}-${clean.slice(-4)}`,
    };
  }, [testNumber, testName]);

  // Testar Etapa da Sequência Agora via WAHA
  const handleSendTestStep = async () => {
    if (!testNumber.trim()) {
      alert(t("Por favor, preencha o número do Slot de Teste."));
      return;
    }

    const currentStep = steps[previewStepIndex] || steps[0];
    if (!currentStep) return;

    setIsSendingTest(true);
    setTestFeedback(null);

    const mediaPayload: MediaAttachment | undefined = currentStep.media
      ? {
          type: currentStep.media.type,
          url: currentStep.media.url || undefined,
          dataUrl: currentStep.media.dataUrl,
          filename: currentStep.media.filename,
          isRecordedVoice: currentStep.media.type === "audio",
        }
      : undefined;

    try {
      const res = await fetch("/api/v1/custom-chat/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-single",
          session: jobSession || sessionName,
          recipient: testContactRecipient,
          template: currentStep.text,
          media: mediaPayload,
          simulateTyping: true,
        }),
      });

      const json = await res.json();

      if (json.ok && json.data?.result?.success) {
        setTestFeedback({
          success: true,
          message: `${t("Fluxo testado com sucesso via WAHA!")} (ID: ${
            json.data.result.messageId || "ok"
          })`,
        });
      } else {
        const err = json.error || json.data?.result?.error || t("Falha no envio de teste");
        setTestFeedback({
          success: false,
          message: err,
        });
      }
    } catch (err: unknown) {
      setTestFeedback({
        success: false,
        message: err instanceof Error ? err.message : t("Falha de conexão"),
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Iniciar validação pré-agendamento
  const handleValidateBeforeSchedule = () => {
    const list = parseContactRecipients(rawRecipients);
    if (list.length === 0) {
      alert(t("Por favor, insira pelo menos um número com DDD válido."));
      return;
    }
    setParsedList(list);
    setValidatorOpen(true);
  };

  // Salvar agendamento com os contatos validados
  const handleConfirmAndSchedule = async (validRecipients: ContactRecipient[]) => {
    try {
      // Converte datetime-local BRT → ISO UTC antes de enviar
      const scheduleTimeUTC = brtLocalToUTC(scheduleDate);

      // Garante que todos os steps têm dataUrl da mídia serializado
      const stepsWithMedia = steps.map((step) => ({
        ...step,
        media: step.media
          ? {
              ...step.media,
              // dataUrl já deve estar presente se foi feito upload local
              dataUrl: step.media.dataUrl || step.media.url,
            }
          : undefined,
      }));

      const res = await fetch("/api/v1/custom-chat/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sessionName: jobSession,
          steps: stepsWithMedia,
          recipients: validRecipients,
          scheduleTime: scheduleTimeUTC,
          createdBy,
          type: steps.length > 1 ? "sequence" : "single",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || t("Falha ao salvar agendamento."));
      }

      await fetchJobs();
      setActiveTab("dashboard");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t("Erro ao agendar."));
    }
  };

  // Ações no agendamento: Executar agora ou Cancelar
  const handleJobAction = async (id: string, action: "execute-now" | "cancel") => {
    try {
      await fetch("/api/v1/custom-chat/schedules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      fetchJobs();
    } catch {
      // Ignora erro
    }
  };

  // Excluir agendamento
  const handleDeleteJob = async (id: string) => {
    if (!confirm(t("Deseja realmente excluir este agendamento?"))) return;
    try {
      await fetch(`/api/v1/custom-chat/schedules?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      fetchJobs();
    } catch {
      // Ignora erro
    }
  };

  const parsedRecipientsList = React.useMemo(() => {
    return parseContactRecipients(rawRecipients);
  }, [rawRecipients]);

  const activePreviewStep = steps[previewStepIndex] || steps[0];
  const activeStepMediaAttachment: MediaAttachment | undefined = activePreviewStep?.media
    ? {
        type: activePreviewStep.media.type,
        url: activePreviewStep.media.url || undefined,
        dataUrl: activePreviewStep.media.dataUrl,
        filename: activePreviewStep.media.filename,
        isRecordedVoice: activePreviewStep.media.type === "audio",
      }
    : undefined;

  return (
    <div className="space-y-6">
      {/* Barra de Alternância do Agendador */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-white text-black shadow-lg"
                : "bg-black text-white/70 border border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <ListChecks size={16} weight="bold" />
            {t("Painel de Agendamentos")} ({jobs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "create"
                ? "bg-white text-black shadow-lg"
                : "bg-black text-white/70 border border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <Plus size={16} weight="bold" />
            {t("Novo Agendamento ou Sequência")}
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchJobs()}
          className="border-white/20 text-white hover:bg-white/10 text-xs h-8 gap-1.5"
        >
          <ArrowsClockwise size={14} /> {t("Atualizar")}
        </Button>
      </div>

      {activeTab === "dashboard" ? (
        /* PAINEL DE GESTÃO E ORGANIZAÇÃO DOS AGENDAMENTOS */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black border border-white/20 shadow-xl flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarBlank size={18} className="text-emerald-400" />
                {t("Painel de Disparos Programados")}
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                {t("Acompanhe o que foi agendado, para quando, para quem e por qual operador.")}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Relógio BRT em tempo real */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-300 text-xs font-mono">
                <Clock size={13} weight="bold" className="text-blue-400" />
                <span className="text-blue-400 font-bold">BRT</span>
                <span className="font-mono tabular-nums">{brtClock}</span>
                <span className="text-blue-400/60 text-[10px]">UTC-3</span>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-xs font-mono">
                {jobs.filter((j) => j.status === "scheduled").length} {t("Pendente(s)")}
              </Badge>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-white/50 text-xs">
              <ArrowsClockwise size={24} className="animate-spin mx-auto mb-2 text-white" />
              {t("Carregando agendamentos...")}
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 rounded-xl bg-black border border-white/15 text-center space-y-3">
              <CalendarBlank size={40} className="mx-auto text-white/40" />
              <h4 className="text-sm font-bold text-white">{t("Nenhum agendamento ativo.")}</h4>
              <p className="text-xs text-white/60 max-w-sm mx-auto">
                {t("Clique em \"Novo Agendamento ou Sequência\" para programar um envio.")}
              </p>
              <Button
                size="sm"
                onClick={() => setActiveTab("create")}
                className="bg-white hover:bg-white/90 text-black font-bold text-xs mt-2"
              >
                <Plus size={14} weight="bold" /> {t("Novo Agendamento ou Sequência")}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/20 overflow-hidden shadow-2xl bg-black">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/15 bg-white/5 text-white/80 font-mono text-[11px] uppercase">
                      <th className="py-3 px-4">{t("Campanha / Sequência")}</th>
                      <th className="py-3 px-4">{t("Data & Hora (Brasília)")}</th>
                      <th className="py-3 px-4">{t("Destinatários")}</th>
                      <th className="py-3 px-4">{t("Operador / Instância")}</th>
                      <th className="py-3 px-4 text-center">{t("Status")}</th>
                      <th className="py-3 px-4 text-right">{t("Ações")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 font-sans">
                    {jobs.map((job) => {
                      const hasAudios = job.steps.some((s) => s.media?.type === "audio");
                      return (
                        <tr key={job.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-sm">{job.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px]">
                                {job.steps.length} {job.steps.length > 1 ? t("etapas") : t("mensagem")}
                              </Badge>
                              {hasAudios && (
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                                  {t("Contém Mídia")}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-white/90">
                            {formatBRT(job.scheduleTime)}
                            <span className="block text-[10px] text-blue-400/70 mt-0.5">BRT</span>
                            {job.status === "scheduled" && (
                              <span className="block text-[10px] text-amber-400 mt-0.5">
                                {t("Aguardando disparador")}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-white font-mono">{job.recipients.length}</span>{" "}
                            <span className="text-white/60">{t("contato(s)")}</span>
                            <p className="text-[10px] text-white/40 truncate max-w-[180px] mt-0.5">
                              {job.recipients.map((r) => r.nomeCompleto).join(", ")}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-white/80 font-medium text-xs">{job.createdBy}</div>
                            <div className="mt-1">
                              <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">
                                📱 {job.sessionName || sessionName}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {job.status === "scheduled" && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                                {t("Agendado")}
                              </Badge>
                            )}
                            {job.status === "running" && (
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] animate-pulse">
                                {t("Em Execução")}
                              </Badge>
                            )}
                            {job.status === "completed" && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                                {t("Finalizado")}
                              </Badge>
                            )}
                            {job.status === "cancelled" && (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px]">
                                {t("Cancelar Fila")}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {job.status === "scheduled" && (
                                <>
                                  {/* Botão Editar */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditModal(job)}
                                    className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10 text-xs h-7 gap-1"
                                    title={t("Editar agendamento")}
                                  >
                                    <PencilSimple size={12} weight="bold" /> {t("Editar")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleJobAction(job.id, "execute-now")}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-7 gap-1"
                                    title={t("Disparar agora")}
                                  >
                                    <Play size={12} weight="bold" /> {t("Disparar")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleJobAction(job.id, "cancel")}
                                    className="border-white/20 text-white hover:bg-white/10 text-xs h-7 w-7 p-0"
                                    title={t("Cancelar agendamento")}
                                  >
                                    <X size={12} />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-white/40 hover:text-red-400 hover:bg-white/10 h-7 w-7 p-0"
                                title={t("Excluir agendamento")}
                              >
                                <Trash size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* FORMULÁRIO DE CRIAÇÃO: MESMA LÓGICA DE LAYOUT (ÚNICO BOX NA ESQUERDA + WHATSAPP PREVIEW NA DIREITA) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LADO ESQUERDO: UM ÚNICO BOX RETANGULAR CONTÍNUO COM TODOS OS CAMPOS E O TESTADOR EM AMARELO NO FINAL */}
          <div className="lg:col-span-7">
            <div className="p-6 rounded-2xl bg-black border border-white/20 shadow-2xl space-y-6">
              {/* 1. Detalhes do Agendamento */}
              <div className="space-y-4">
                <Label className="text-sm font-bold text-white uppercase tracking-wider block">
                  {t("Detalhes do Agendamento")}
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/70 block mb-1">{t("Título da Campanha:")}</label>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-black border-white/20 text-white text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/70 block mb-1">{t("Responsável / Operador:")}</label>
                    <Input
                      type="text"
                      value={createdBy}
                      onChange={(e) => setCreatedBy(e.target.value)}
                      className="bg-black border-white/20 text-white text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/70 block mb-1">{t("Instância de Disparo:")}</label>
                    <select
                      value={jobSession}
                      onChange={(e) => handleJobSessionChange(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-md text-emerald-400 font-mono text-xs h-9 px-2 focus:border-white focus:outline-none cursor-pointer"
                      title={t("Escolha a instância WhatsApp que executará o disparo")}
                    >
                      {availableSessions && availableSessions.length > 0 ? (
                        availableSessions.map((s) => (
                          <option key={s.name} value={s.name} className="bg-neutral-900 text-white font-mono">
                            {s.phone ? `+${s.phone}` : s.name} {s.pushName ? `(${s.pushName})` : ""} · [{s.status}]
                          </option>
                        ))
                      ) : (
                        <option value={sessionName} className="bg-neutral-900 text-white font-mono">
                          {sessionName} {sessionPhone ? `(+${sessionPhone})` : ""}
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1">
                    {t("Data & Hora de Disparo:")}
                    <span className="ml-1.5 text-blue-400 font-mono font-bold text-[10px] bg-blue-950/30 border border-blue-500/30 px-1.5 py-0.5 rounded">
                      Horário de Brasília (BRT)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="bg-black border-white/20 text-white text-xs h-9 font-mono flex-1"
                    />
                    <div className="flex items-center gap-1 px-2 py-1.5 rounded bg-blue-950/30 border border-blue-500/30 text-blue-300 text-[11px] font-mono shrink-0">
                      <Clock size={11} />
                      {brtClock.slice(0, 5)}
                    </div>
                  </div>
                  {/* Atalhos rápidos de agendamento */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] text-white/50">{t("Atalhos rápidos:")}</span>
                    <button
                      type="button"
                      onClick={() => setScheduleDate(addMinutesToBRT(1))}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold transition-colors"
                    >
                      +1 min
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleDate(addMinutesToBRT(5))}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-mono text-[11px] transition-colors"
                    >
                      +5 min
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleDate(addMinutesToBRT(15))}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-mono text-[11px] transition-colors"
                    >
                      +15 min
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleDate(addMinutesToBRT(60))}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-mono text-[11px] transition-colors"
                    >
                      +1 hora
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleDate(setTomorrowBRT(9, 0))}
                      className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-mono text-[11px] transition-colors"
                    >
                      Amanhã 09:00
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">UTC-3 · Brasília · São Paulo</p>
                </div>
              </div>

              {/* 2. Destinatários com Chaves */}
              <div className="pt-5 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-white uppercase tracking-wider">
                    {t("Destinatários")}
                  </Label>
                  <Badge variant="outline" className="border-white/20 text-white text-xs font-mono">
                    {parsedRecipientsList.length} {t("contato(s)")}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] space-y-1">
                  <span className="font-semibold text-white/90">{t("Padrão reconhecido:")}</span>
                  <p className="font-mono text-emerald-400 text-[10px]">
                    Carlos/Eduardo/Carlos Eduardo, VIP +5531999999999
                  </p>
                </div>

                <Textarea
                  rows={4}
                  value={rawRecipients}
                  onChange={(e) => setRawRecipients(e.target.value)}
                  placeholder={t("Carlos/Eduardo/Carlos Eduardo, VIP +553175023319")}
                  className="bg-black border-white/20 text-white font-mono text-xs focus:border-white focus:ring-1 focus:ring-white resize-none"
                />
              </div>

              {/* 3. Sequência de Mensagens em Etapas */}
              <div className="pt-5 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <Label className="text-sm font-bold text-white uppercase tracking-wider block">
                      {t("Sequência de Mensagens")} ({steps.length} {steps.length > 1 ? t("etapas") : t("mensagem")})
                    </Label>
                    <p className="text-xs text-white/60 mt-0.5">
                      {t("Configure os textos com Spintax, anexos de áudio/mídia e intervalos entre cada envio.")}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleAddStep}
                    className="bg-white hover:bg-white/90 text-black font-bold text-xs h-8 gap-1.5"
                  >
                    <Plus size={14} weight="bold" /> {t("Adicionar Etapa")}
                  </Button>
                </div>

                {/* Seletor da Etapa para Prévia */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[10px] text-white/60 uppercase font-semibold shrink-0">
                    {t("Selecione a etapa para pré-visualização e teste:")}
                  </span>
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewStepIndex(i)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                        previewStepIndex === i
                          ? "bg-emerald-500 text-black shadow"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {t("Etapa #")}{i + 1}
                    </button>
                  ))}
                </div>

                {/* Cards das Etapas */}
                <div className="space-y-4">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border space-y-3 relative transition-all ${
                        previewStepIndex === idx
                          ? "bg-white/10 border-emerald-500/50 shadow-lg"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPreviewStepIndex(idx)}
                          className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono"
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">
                            {step.stepNumber}
                          </span>
                          {t("Etapa #")}{step.stepNumber}
                          {previewStepIndex === idx && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] py-0 ml-1">
                              {t("Prévia Ativa")}
                            </Badge>
                          )}
                        </button>

                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="text-white/40 hover:text-red-400 transition-colors"
                            title={t("Remover Etapa")}
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>

                      <Textarea
                        rows={3}
                        value={step.text}
                        onChange={(e) => handleStepTextChange(idx, e.target.value)}
                        placeholder={t("Mensagem da etapa com Spintax {Olá|Oi} {primeiro_nome}...")}
                        className="bg-black border-white/20 text-white text-xs resize-none"
                      />

                      {/* Upload de Mídia na Etapa (Áudio é sempre PTT) */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-white/60">
                            {t("Anexar Mídia:")}
                          </label>
                          <Input
                            type="file"
                            onChange={(e) => handleStepMediaUpload(idx, e)}
                            accept="image/*,audio/*,video/*,application/pdf"
                            className="bg-black border-white/20 text-white text-xs h-7 w-44 cursor-pointer"
                          />
                          {onOpenMediaLibrary && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPreviewStepIndex(idx);
                                onOpenMediaLibrary();
                              }}
                              className="h-7 px-2 text-[10px] border-white/20 text-white hover:bg-white/10 gap-1"
                            >
                              <FolderSimple size={12} />
                              {t("Biblioteca")}
                            </Button>
                          )}
                        </div>

                        {step.media && (
                          <span className="text-emerald-300 text-[11px] font-mono flex items-center gap-1">
                            {step.media.type === "audio" && <Microphone size={13} />}
                            [{step.media.type.toUpperCase()}]
                          </span>
                        )}
                      </div>

                      {step.media && (
                        <div className="p-2 rounded bg-black/50 border border-white/10 text-xs flex items-center justify-between">
                          <span className="text-emerald-300 text-[11px] font-mono truncate max-w-[280px]">
                            {t("Mídia vinculada:")} {(step.media.filename || step.media.url || "anexo").substring(0, 30)}...
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSteps((prev) => {
                                const copy = [...prev];
                                const current = copy[idx];
                                if (current) {
                                  copy[idx] = { ...current, media: undefined, stepNumber: idx + 1 };
                                }
                                return copy;
                              });
                            }}
                            className="text-white/40 hover:text-red-400 text-xs"
                          >
                            {t("Remover mídia")}
                          </button>
                        </div>
                      )}

                      {/* Intervalo para a próxima etapa */}
                      {idx < steps.length - 1 && (
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                          <span className="text-white/70 flex items-center gap-1">
                            <Clock size={14} className="text-amber-400" /> {t("Aguardar antes da próxima etapa:")}
                          </span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={10}
                              value={step.delayAfterSeconds || 120}
                              onChange={(e) => handleStepDelayChange(idx, Number(e.target.value))}
                              className="bg-black border-white/20 text-white text-xs h-7 w-20 text-right font-mono"
                            />
                            <span className="text-white/60 text-[11px]">{t("segundos")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Botões de Ação Principal: Salvar Agendamento */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  size="lg"
                  onClick={handleValidateBeforeSchedule}
                  className="w-full bg-white hover:bg-white/90 text-black font-black tracking-wide text-xs sm:text-sm py-6 shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                >
                  <ShieldCheck size={18} weight="bold" />
                  {t("Validar e Agendar")}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const list = parseContactRecipients(rawRecipients);
                    if (list.length === 0) {
                      alert(t("Por favor, insira pelo menos um número com DDD válido."));
                      return;
                    }
                    handleConfirmAndSchedule(list);
                  }}
                  className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-bold tracking-wide text-xs sm:text-sm py-6 shadow-xl transition-all gap-2"
                >
                  <CalendarBlank size={18} weight="bold" />
                  {t("Agendar Direto")}
                </Button>
              </div>

              {/* 5. NO FINAL DO BOX: O TESTADOR EM AMARELO DO AGENDADOR */}
              <div className="p-5 rounded-xl border-2 border-yellow-500/60 bg-yellow-950/20 shadow-xl space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-2">
                    <Lightning size={16} className="text-yellow-400" weight="bold" />
                    {t("Slot de Teste do Agendador")}
                  </Label>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-[10px]">
                    {t("Padrão: 31998622489")}
                  </Badge>
                </div>
                <p className="text-xs text-yellow-200/70">
                  {t("Dispare a etapa selecionada para o número de teste e comprove o fluxo no WhatsApp antes de agendar.")}
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-yellow-200/80 block mb-1">
                        {t("Número de Telefone (com DDD):")}
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={testNumber}
                          onChange={(e) => setTestNumber(e.target.value)}
                          placeholder="31998622489"
                          className="bg-black border-yellow-500/30 text-white font-mono text-xs h-9 pl-8 focus:border-yellow-400"
                        />
                        <Phone size={14} className="absolute left-2.5 top-2.5 text-yellow-400" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-yellow-200/80 block mb-1">
                        {t("Nome para Simulação:")}
                      </label>
                      <Input
                        type="text"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        placeholder="Nome do contato teste"
                        className="bg-black border-yellow-500/30 text-white text-xs h-9"
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSendTestStep}
                    disabled={isSendingTest}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs h-9 gap-2 shadow-lg transition-all"
                  >
                    {isSendingTest ? (
                      <ArrowsClockwise size={14} className="animate-spin" />
                    ) : (
                      <Lightning size={14} weight="bold" />
                    )}
                    {t("Testar Fluxo Agora")} ({t("Etapa #")}{previewStepIndex + 1})
                  </Button>

                  {testFeedback && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                        testFeedback.success
                          ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                          : "bg-red-950/40 border-red-500/50 text-red-300"
                      }`}
                    >
                      {testFeedback.success ? <CheckCircle size={15} /> : <Warning size={15} />}
                      <span className="truncate">{testFeedback.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: REAL-TIME WHATSAPP LIVE PREVIEW DA ETAPA DO AGENDADOR */}
          <div className="lg:col-span-5 sticky top-6">
            <WhatsAppChatPreview
              messageTemplate={activePreviewStep?.text || ""}
              recipients={parsedRecipientsList}
              testRecipient={testContactRecipient}
              media={activeStepMediaAttachment}
              activeSessionPhone={sessionPhone}
            />
          </div>
        </div>
      )}

      {/* Modal de Validação Pré-Voo */}
      <ValidadorModal
        open={validatorOpen}
        onOpenChange={setValidatorOpen}
        recipients={parsedList}
        session={sessionName}
        onConfirmValidOnly={handleConfirmAndSchedule}
      />

      {/* ── Modal de Edição de Agendamento ── */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-black border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/15">
              <div className="flex items-center gap-2">
                <PencilSimple size={18} className="text-blue-400" weight="bold" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {t("Editar Agendamento")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Título & Instância de Disparo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70 block mb-1">{t("Título da Campanha:")}</label>
                  <Input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-black border-white/20 text-white text-xs h-9"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/70 block mb-1 flex items-center justify-between">
                    <span>{t("Instância de Disparo:")}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">📱 WhatsApp</span>
                  </label>
                  <select
                    value={editSession}
                    onChange={(e) => setEditSession(e.target.value)}
                    className="w-full h-9 rounded-md bg-black border border-white/20 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    {availableSessions && availableSessions.length > 0 ? (
                      availableSessions.map((s) => (
                        <option key={s.name} value={s.name} className="bg-neutral-900 text-white">
                          {s.name} {s.phone ? `(${s.phone})` : ""} {s.status === "WORKING" ? "🟢" : "⚪"}
                        </option>
                      ))
                    ) : (
                      <option value={editSession || sessionName} className="bg-neutral-900 text-white">
                        {editSession || sessionName}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Data e Hora */}
              <div>
                <label className="text-xs text-white/70 block mb-1">
                  {t("Data & Hora de Disparo:")}{" "}
                  <span className="text-blue-400 font-mono text-[10px] bg-blue-950/30 border border-blue-500/30 px-1.5 py-0.5 rounded">
                    Horário de Brasília (BRT)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-black border-white/20 text-white text-xs h-9 font-mono flex-1"
                  />
                  <div className="flex items-center gap-1 px-2 py-1.5 rounded bg-blue-950/30 border border-blue-500/30 text-blue-300 text-[11px] font-mono shrink-0">
                    <Clock size={11} />
                    {brtClock.slice(0, 5)}
                  </div>
                </div>
                {/* Atalhos rápidos de edição */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-white/50">{t("Atalhos rápidos:")}</span>
                  <button
                    type="button"
                    onClick={() => setEditDate(addMinutesToBRT(1))}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold transition-colors"
                  >
                    +1 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDate(addMinutesToBRT(5))}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-mono text-[11px] transition-colors"
                  >
                    +5 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDate(addMinutesToBRT(15))}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-mono text-[11px] transition-colors"
                  >
                    +15 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDate(addMinutesToBRT(60))}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-mono text-[11px] transition-colors"
                  >
                    +1 hora
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDate(setTomorrowBRT(9, 0))}
                    className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-mono text-[11px] transition-colors"
                  >
                    Amanhã 09:00
                  </button>
                </div>
              </div>

              {/* Etapas — texto editável */}
              <div className="space-y-3">
                <label className="text-xs text-white/70 font-bold uppercase tracking-wider block">
                  {t("Etapas da Sequência")}
                </label>
                {editSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-bold uppercase">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      {t("Etapa #")}{idx + 1}
                      {step.media && (
                        <span className="ml-1 text-[10px] text-blue-300 font-normal">· [{step.media.type.toUpperCase()}]</span>
                      )}
                    </div>
                    <Textarea
                      rows={2}
                      value={step.text}
                      onChange={(e) => setEditSteps((prev) => {
                        const copy = [...prev];
                        const cur = copy[idx];
                        if (cur) copy[idx] = { ...cur, text: e.target.value };
                        return copy;
                      })}
                      className="bg-black border-white/20 text-white text-xs resize-none"
                      placeholder={t("Texto da mensagem com Spintax...")}
                    />
                    {idx < editSteps.length - 1 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Clock size={11} className="text-amber-400" />
                        <span className="text-white/60">{t("Aguardar:")}</span>
                        <Input
                          type="number"
                          min={10}
                          value={step.delayAfterSeconds || 120}
                          onChange={(e) => setEditSteps((prev) => {
                            const copy = [...prev];
                            const cur = copy[idx];
                            if (cur) copy[idx] = { ...cur, delayAfterSeconds: Number(e.target.value) };
                            return copy;
                          })}
                          className="bg-black border-white/20 text-white text-xs h-7 w-20 text-right font-mono"
                        />
                        <span className="text-white/40 text-[11px]">{t("segundos")}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/15 flex items-center justify-end gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingJob(null)}
                className="border-white/20 text-white hover:bg-white/10 text-xs"
              >
                {t("Cancelar")}
              </Button>
              <Button
                size="sm"
                onClick={() => void handleConfirmEdit()}
                disabled={isSavingEdit}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs gap-1.5"
              >
                {isSavingEdit ? (
                  <ArrowsClockwise size={13} className="animate-spin" />
                ) : (
                  <PencilSimple size={13} weight="bold" />
                )}
                {t("Salvar Edição")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
