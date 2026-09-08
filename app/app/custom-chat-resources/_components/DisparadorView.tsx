"use client";

import * as React from "react";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  PaperPlaneTilt,
  ShieldCheck,
  Sparkle,
  Clock,
  X,
  CheckCircle,
  Warning,
  Eye,
  ArrowsClockwise,
  Microphone,
  FolderSimple,
  Lightning,
  Phone,
  UsersThree,
} from "@/lib/ui/icons";
import { useWahaGroups } from "@/hooks/custom-chat/useWahaGroups";
import {
  parseContactRecipients,
  ContactRecipient,
  generateSpintaxPreviews,
  generateUniqueMessage,
} from "@/lib/custom-chat/spintax";
import { ValidadorModal } from "./ValidadorModal";
import { MediaAttachment } from "@/lib/custom-chat/waha-dispatcher";
import { WhatsAppChatPreview } from "./WhatsAppChatPreview";
import { MonitorItem } from "./MonitorView";

interface DisparadorViewProps {
  sessionName: string;
  sessionPhone?: string;
  availableSessions?: Array<{
    name: string;
    status: string;
    phone?: string;
    pushName?: string;
  }>;
  onSelectSession?: (name: string) => void;
  onStartMonitor: (items: MonitorItem[], config: {
    template: string;
    media?: MediaAttachment;
    simulateTyping: boolean;
    spacingMode: "direct" | "alternating";
    directInterval: number;
    directUnit: "seconds" | "minutes";
    minInterval: number;
    maxInterval: number;
  }) => void;
  onOpenMediaLibrary: () => void;
  selectedMediaFromLibrary?: MediaAttachment;
}

export function DisparadorView({
  sessionName,
  sessionPhone,
  availableSessions,
  onSelectSession,
  onStartMonitor,
  onOpenMediaLibrary,
  selectedMediaFromLibrary,
}: DisparadorViewProps) {
  const t = useT();

  // 1. Destinatários (Persistido no localStorage)
  const [rawContacts, setRawContacts] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deskcomm_disparador_raw_contacts");
      if (saved !== null) return saved;
    }
    return "Carlos/Eduardo/Carlos Eduardo, Cliente VIP +553175023319\nMariana/Silva/Mariana Silva, Proposta Especial +5511999998888\n+5521988887777";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deskcomm_disparador_raw_contacts", rawContacts);
    }
  }, [rawContacts]);

  // ── Modo Grupo (WhatsApp Groups) ──────────────────────────────────────────
  const [isGroupMode, setIsGroupMode] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState("");
  const [selectedGroupName, setSelectedGroupName] = React.useState("");

  const {
    groups: availableGroups,
    isLoading: isLoadingGroups,
    error: groupsError,
    reload: reloadGroups,
  } = useWahaGroups(sessionName, isGroupMode);

  React.useEffect(() => {
    if (!isGroupMode) {
      setSelectedGroupId("");
      setSelectedGroupName("");
    }
  }, [isGroupMode]);

  const handleDispatchGroup = () => {
    if (!selectedGroupId) {
      alert(t("Por favor, selecione um grupo de destino."));
      return;
    }

    const groupRecipient: ContactRecipient = {
      raw: selectedGroupName || "Grupo WhatsApp",
      primeiroNome: selectedGroupName || "Grupo",
      segundoNome: "",
      nomeCompleto: selectedGroupName || "Grupo",
      customTexto: "",
      numero: selectedGroupId,
      numeroLimpo: selectedGroupId.replace(/\D/g, ""),
      chatId: selectedGroupId,
    };

    handleConfirmAndDispatch([groupRecipient]);
  };

  // 2. Slot de Teste (Padrão obrigatório: 31998622489)
  const [testNumber, setTestNumber] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deskcomm_disparador_test_number");
      if (saved) return saved;
    }
    return "31998622489";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deskcomm_disparador_test_number", testNumber);
    }
  }, [testNumber]);

  const [testName, setTestName] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deskcomm_disparador_test_name");
      if (saved) return saved;
    }
    return "Gestor Teste";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deskcomm_disparador_test_name", testName);
    }
  }, [testName]);

  const [isSendingTest, setIsSendingTest] = React.useState<boolean>(false);
  const [testFeedback, setTestFeedback] = React.useState<{
    success?: boolean;
    message: string;
  } | null>(null);

  // 3. Template de Mensagem com Spintax
  const [messageTemplate, setMessageTemplate] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deskcomm_disparador_template");
      if (saved) return saved;
    }
    return "{Olá|Oi|E aí} {primeiro_nome}, {tudo bem?|como vai você?}\n\n{Passando para confirmar nosso alinhamento|Gostaria de te enviar essa informação em primeira mão!}\n\nQualquer dúvida, {estou à disposição!|só me chamar aqui no WhatsApp!}";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deskcomm_disparador_template", messageTemplate);
    }
  }, [messageTemplate]);

  // 4. Espaçamento e Pacing (Fica IMEDIATAMENTE ABAIXO da mensagem dinâmica)
  const [spacingMode, setSpacingMode] = React.useState<"direct" | "alternating">("alternating");
  const [directInterval, setDirectInterval] = React.useState<number>(10);
  const [directUnit, setDirectUnit] = React.useState<"seconds" | "minutes">("seconds");
  const [minInterval, setMinInterval] = React.useState<number>(15);
  const [maxInterval, setMaxInterval] = React.useState<number>(45);

  // 5. Anti-ban: Presença de digitação humana WAHA
  const [simulateTyping, setSimulateTyping] = React.useState<boolean>(true);

  // 6. Mídias
  const [hasMedia, setHasMedia] = React.useState<boolean>(false);
  const [mediaType, setMediaType] = React.useState<"image" | "audio" | "video" | "document">("image");
  const [mediaUrl, setMediaUrl] = React.useState<string>("");
  const [mediaDataUrl, setMediaDataUrl] = React.useState<string | undefined>(undefined);
  const [mediaFilename, setMediaFilename] = React.useState<string>("");
  const [mediaCaption, setMediaCaption] = React.useState<string>("");

  // Atualiza mídia quando selecionada na Central de Mídias
  React.useEffect(() => {
    if (selectedMediaFromLibrary) {
      setHasMedia(true);
      setMediaType(selectedMediaFromLibrary.type);
      setMediaUrl(selectedMediaFromLibrary.url || "");
      setMediaDataUrl(selectedMediaFromLibrary.dataUrl);
      setMediaFilename(selectedMediaFromLibrary.filename || "");
      if (selectedMediaFromLibrary.caption) {
        setMediaCaption(selectedMediaFromLibrary.caption);
      }
    }
  }, [selectedMediaFromLibrary]);

  // 7. Preview e Spintax
  const [showSpintaxPreview, setShowSpintaxPreview] = React.useState<boolean>(false);
  const [previews, setPreviews] = React.useState<string[]>([]);

  // 8. Validador Modal
  const [validatorOpen, setValidatorOpen] = React.useState<boolean>(false);
  const [parsedList, setParsedList] = React.useState<ContactRecipient[]>([]);

  // Lista de contatos parseada
  const currentParsed = React.useMemo(() => {
    return parseContactRecipients(rawContacts);
  }, [rawContacts]);

  // Contato de teste modelado como ContactRecipient
  const testContactRecipient = React.useMemo<ContactRecipient>(() => {
    const clean = testNumber.replace(/\D/g, "");
    return {
      raw: testNumber,
      primeiroNome: testName.split(" ")[0] || "Teste",
      segundoNome: testName.split(" ").slice(1).join(" ") || "",
      nomeCompleto: testName,
      customTexto: "Slot Teste",
      numero: clean,
      numeroLimpo: clean,
      numeroFormatado: `+55 ${clean.slice(-11, -9)} ${clean.slice(-9, -4)}-${clean.slice(-4)}`,
    };
  }, [testNumber, testName]);

  // Inserir tag rápida no cursor
  const handleInsertTag = (tag: string) => {
    setMessageTemplate((prev) => prev + " " + tag);
  };

  // Testar spintax textual
  const handleTestSpintax = () => {
    const list = generateSpintaxPreviews(messageTemplate, 3);
    setPreviews(list);
    setShowSpintaxPreview(true);
  };

  // Upload local rápido de mídia diretamente no formulário (áudio é sempre PTT gravado na hora)
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: "image" | "audio" | "video" | "document" = "document";
    if (file.type.startsWith("image/")) type = "image";
    else if (file.type.startsWith("audio/")) type = "audio";
    else if (file.type.startsWith("video/")) type = "video";

    // Pré-visualização instantânea local (zero latência no chat preview)
    const localBlobUrl = URL.createObjectURL(file);
    setHasMedia(true);
    setMediaType(type);
    setMediaUrl(localBlobUrl);
    setMediaFilename(file.name);

    // Converte para Base64 DataURL
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setMediaDataUrl(b64);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("name", file.name);
    if (type === "audio") {
      formData.append("isRecordedVoice", "true");
    }

    try {
      const res = await fetch("/api/v1/custom-chat/media", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.ok && json.data) {
        setHasMedia(true);
        setMediaType(type);
        setMediaUrl(json.data.url);
        if (json.data.dataUrl) {
          setMediaDataUrl(json.data.dataUrl);
        }
        setMediaFilename(file.name);
      }
    } catch {
      // Preview local já assegurado
    }
  };

  // Enviar Teste Imediato para o Slot de Teste (Padrão 31998622489)
  const handleSendTestMessage = async () => {
    if (!testNumber.trim()) {
      alert(t("Por favor, preencha o número do Slot de Teste."));
      return;
    }

    setIsSendingTest(true);
    setTestFeedback(null);

    const mediaPayload: MediaAttachment | undefined =
      hasMedia && (mediaUrl.trim() || mediaDataUrl)
        ? {
            type: mediaType,
            url: mediaUrl.trim() || undefined,
            dataUrl: mediaDataUrl,
            filename: mediaFilename || (mediaType === "audio" ? "voice.ogg" : "anexo"),
            caption: mediaCaption || undefined,
            isRecordedVoice: mediaType === "audio",
          }
        : undefined;

    try {
      const res = await fetch("/api/v1/custom-chat/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-single",
          session: sessionName,
          recipient: testContactRecipient,
          template: messageTemplate,
          media: mediaPayload,
          simulateTyping,
        }),
      });

      const json = await res.json();

      if (json.ok && json.data?.result?.success) {
        setTestFeedback({
          success: true,
          message: `${t("Mensagem de teste entregue via WAHA com sucesso!")} (ID: ${
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

  // Dispara o fluxo de validação antes de começar
  const handleStartValidationFlow = () => {
    const list = parseContactRecipients(rawContacts);
    if (list.length === 0) {
      alert(t("Por favor, insira pelo menos um número com DDD válido."));
      return;
    }
    setParsedList(list);
    setValidatorOpen(true);
  };

  // Iniciar disparo do lote e abrir o Monitor
  const handleConfirmAndDispatch = (validRecipients: ContactRecipient[]) => {
    if (validRecipients.length === 0) return;

    const mediaPayload: MediaAttachment | undefined =
      hasMedia && (mediaUrl.trim() || mediaDataUrl)
        ? {
            type: mediaType,
            url: mediaUrl.trim() || undefined,
            dataUrl: mediaDataUrl,
            caption: mediaCaption || undefined,
            isRecordedVoice: mediaType === "audio",
          }
        : undefined;

    const monitorItems: MonitorItem[] = validRecipients.map((rec, index) => ({
      id: `item_${Date.now()}_${index}`,
      recipient: rec,
      status: "pending",
      generatedText: generateUniqueMessage(messageTemplate, rec),
    }));

    onStartMonitor(monitorItems, {
      template: messageTemplate,
      media: mediaPayload,
      simulateTyping,
      spacingMode,
      directInterval,
      directUnit,
      minInterval,
      maxInterval,
    });
  };

  const currentMediaAttachment: MediaAttachment | undefined =
    hasMedia && (mediaUrl.trim() || mediaDataUrl)
      ? {
          type: mediaType,
          url: mediaUrl.trim() || undefined,
          dataUrl: mediaDataUrl,
          filename: mediaFilename || (mediaType === "audio" ? "voice.ogg" : "anexo"),
          caption: mediaCaption || undefined,
          isRecordedVoice: mediaType === "audio",
        }
      : undefined;

  return (
    <div className="space-y-6">
      {/* Banner Superior Anti-Ban e Sessão Conectada */}
      <div className="p-4 rounded-xl bg-black border border-white/20 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck size={26} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                {t("Motor Anti-Ban Ativo")}
              </h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                {t("Longevidade Máxima")}
              </Badge>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              {t("Spintax recursivo, simulação de digitação humana e validação prévia contra rejeições.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 font-semibold">{t("Instância de Disparo:")}</span>
            {availableSessions && availableSessions.length > 0 ? (
              <select
                value={sessionName}
                onChange={(e) => onSelectSession?.(e.target.value)}
                className="bg-black text-emerald-400 font-mono text-xs border-0 focus:ring-0 focus:outline-none cursor-pointer pr-1"
                title={t("Selecione a instância que fará os disparos")}
              >
                {availableSessions.map((s) => (
                  <option key={s.name} value={s.name} className="bg-neutral-900 text-white font-mono">
                    {s.phone ? `+${s.phone}` : s.name} {s.pushName ? `(${s.pushName})` : ""} · [{s.status}]
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-emerald-400 font-semibold">{sessionName}</span>
            )}
            {sessionPhone && <span className="text-white/50 text-[11px]">({sessionPhone})</span>}
          </div>
        </div>
      </div>

      {/* Grid: LADO ESQUERDO (Único Box Retangular Contínuo) vs LADO DIREITO (Real-Time WhatsApp Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: UM ÚNICO BOX RETANGULAR CONTÍNUO COM TODOS OS ITENS E TESTADOR EM AMARELO NO FINAL */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-2xl bg-black border border-white/20 shadow-2xl space-y-6">
            {/* ── Seletor de Modo: Individual vs Grupo ── */}
            <div className="p-4 rounded-xl border border-white/20 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersThree size={18} className={isGroupMode ? "text-emerald-400" : "text-white/60"} weight="bold" />
                  <div>
                    <Label htmlFor="group-mode-toggle" className="text-xs font-bold text-white uppercase tracking-wider cursor-pointer">
                      {t("Disparo para Grupo de WhatsApp")}
                    </Label>
                    <p className="text-[11px] text-white/60">
                      {t("Ative para disparar mensagens diretamente em um grupo da instância selecionada.")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isGroupMode && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                      {t("MODO GRUPO ATIVO")}
                    </Badge>
                  )}
                  <Switch
                    id="group-mode-toggle"
                    checked={isGroupMode}
                    onCheckedChange={setIsGroupMode}
                  />
                </div>
              </div>

              {isGroupMode && (
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-white/80 font-semibold block">
                      {t("Grupo de Destino na Instância:")} <span className="text-emerald-400 font-mono">{sessionName}</span>
                    </label>
                    <button
                      type="button"
                      onClick={reloadGroups}
                      disabled={isLoadingGroups}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors disabled:opacity-40"
                    >
                      <ArrowsClockwise size={12} className={isLoadingGroups ? "animate-spin" : ""} />
                      {t("Atualizar Grupos")}
                    </button>
                  </div>

                  <select
                    value={selectedGroupId}
                    onChange={(e) => {
                      const gid = e.target.value;
                      setSelectedGroupId(gid);
                      const found = availableGroups.find((g) => g.id === gid);
                      setSelectedGroupName(found?.name || "");
                    }}
                    disabled={isLoadingGroups}
                    className="w-full h-10 rounded-md bg-black border border-white/20 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                  >
                    <option value="">
                      {isLoadingGroups
                        ? t("Buscando grupos no WhatsApp...")
                        : availableGroups.length === 0
                        ? t("Nenhum grupo encontrado nesta instância")
                        : t("— Selecione um grupo da lista —")}
                    </option>
                    {availableGroups.map((g) => (
                      <option key={g.id} value={g.id} className="bg-neutral-900 text-white">
                        {g.name} {g.participantsCount ? `(${g.participantsCount} membros)` : ""}
                      </option>
                    ))}
                  </select>

                  {groupsError && (
                    <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-[11px] text-red-300 flex items-center gap-1.5">
                      <Warning size={13} />
                      <span>{groupsError}</span>
                    </div>
                  )}

                  {selectedGroupId && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle size={14} weight="fill" />
                        <span className="font-bold truncate">{selectedGroupName}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 shrink-0">
                        {selectedGroupId}
                      </Badge>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-yellow-950/20 border border-yellow-500/30 text-[11px] text-yellow-200/80">
                    💡 {t("No envio para grupos, tags individuais de contato como {primeiro_nome} não são aplicadas. Variações Spintax e anexos continuam funcionando 100%.")}
                  </div>
                </div>
              )}
            </div>

            {/* 1. Destinatários com Chaves (Apenas se não estiver no modo grupo) */}
            {!isGroupMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {t("Destinatários com Chaves")}
                  </Label>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    {t("Insira linha por linha no formato de chaves com +55.")}
                  </p>
                </div>
                <Badge variant="outline" className="border-white/20 text-white font-mono text-xs">
                  {currentParsed.length} {t("detectado(s)")}
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-[11px] space-y-1">
                <span className="font-semibold text-white/90">{t("Padrão reconhecido:")}</span>
                <p className="font-mono text-emerald-400 text-[10px] break-all">
                  (primeiro nome)/(segundonome)/(primeiro + segundo nome), (string, texto) + numero formatado
                </p>
                <p className="text-white/50 text-[10px]">
                  {t("Exemplo:")} <span className="text-white/80">Carlos/Eduardo/Carlos Eduardo, VIP +5531999999999</span>
                </p>
              </div>

              <Textarea
                rows={6}
                value={rawContacts}
                onChange={(e) => setRawContacts(e.target.value)}
                placeholder={t("Carlos/Eduardo/Carlos Eduardo, Cliente VIP +5531999999999")}
                className="bg-black border-white/20 text-white font-mono text-xs focus:border-white focus:ring-1 focus:ring-white resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-white/50">
                  {t("DDD e prefixo +55 sanitizados automaticamente.")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRawContacts("")}
                  className="text-xs text-white/60 hover:text-white hover:bg-white/10 h-7"
                >
                  {t("Limpar Lista")}
                </Button>
              </div>
            </div>
            )}

            {/* 2. Mensagem Dinâmica com Spintax */}
            <div className="pt-5 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {t("Mensagem Dinâmica com Spintax")}
                  </Label>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    {t("Use chaves")} <span className="font-mono text-emerald-400">{"{opcao1|opcao2}"}</span> {t("para criar mensagens aleatórias e únicas por destinatário.")}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestSpintax}
                  className="gap-1.5 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30 text-xs h-8"
                >
                  <Eye size={14} />
                  {t("Testar Variação")}
                </Button>
              </div>

              {/* Chips de Inserção Rápida */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-white/60 mr-1 uppercase tracking-wider font-semibold">
                  {t("Inserir tag:")}
                </span>
                {[
                  { label: "{primeiro_nome}", desc: t("Primeiro nome") },
                  { label: "{segundo_nome}", desc: t("Sobrenome") },
                  { label: "{nome_completo}", desc: t("Nome completo") },
                  { label: "{custom_texto}", desc: t("Tag/texto custom") },
                  { label: "{numero}", desc: t("Telefone") },
                  { label: "{saudacao}", desc: t("Bom dia/tarde/noite") },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleInsertTag(chip.label)}
                    className="px-2 py-1 rounded bg-white/5 border border-white/15 text-[11px] font-mono text-white/90 hover:bg-white/15 hover:border-white transition-colors"
                    title={chip.desc}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <Textarea
                rows={6}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder={t("Ex: {Olá|Oi} {primeiro_nome}, {como vai?|tudo bem com você?}...")}
                className="bg-black border-white/20 text-white text-xs focus:border-white focus:ring-1 focus:ring-white resize-none font-sans"
              />

              {showSpintaxPreview && (
                <div className="p-3.5 rounded-lg bg-white/5 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkle size={14} /> {t("Amostras Aleatórias de Variação (Spintax):")}
                    </span>
                    <button onClick={() => setShowSpintaxPreview(false)} className="text-white/40 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {previews.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-black/60 border border-white/10 text-[11px] text-white/90 font-mono whitespace-pre-wrap"
                      >
                        <span className="text-[9px] text-emerald-400 block mb-1 font-sans">
                          {t("Variação #")}{idx + 1}:
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. ESPAÇAMENTO E PACING (IMEDIATAMENTE ABAIXO DA MENSAGEM DINÂMICA) */}
            <div className="pt-5 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} /> {t("Espaçamento & Pacing")}
                </Label>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                  {t("Anti-Bloqueio")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSpacingMode("alternating")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                    spacingMode === "alternating"
                      ? "bg-white text-black border-white shadow-lg"
                      : "bg-black text-white/70 border-white/15 hover:border-white/40"
                  }`}
                >
                  <span className="block font-bold">{t("Alternante (Aleatório)")}</span>
                  <span className="text-[10px] opacity-80">{t("Jitter imprevisível entre X e Y s")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSpacingMode("direct")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                    spacingMode === "direct"
                      ? "bg-white text-black border-white shadow-lg"
                      : "bg-black text-white/70 border-white/15 hover:border-white/40"
                  }`}
                >
                  <span className="block font-bold">{t("Espaço Direto (Fixo)")}</span>
                  <span className="text-[10px] opacity-80">{t("Intervalo regular constante")}</span>
                </button>
              </div>

              {spacingMode === "alternating" ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-white/70 block mb-1">{t("Mínimo (segundos):")}</label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={minInterval}
                      onChange={(e) => setMinInterval(Number(e.target.value))}
                      className="bg-black border-white/20 text-white text-xs h-9"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/70 block mb-1">{t("Máximo (segundos):")}</label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={maxInterval}
                      onChange={(e) => setMaxInterval(Number(e.target.value))}
                      className="bg-black border-white/20 text-white text-xs h-9"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1">
                    <label className="text-[11px] text-white/70 block mb-1">{t("A cada:")}</label>
                    <Input
                      type="number"
                      min={1}
                      value={directInterval}
                      onChange={(e) => setDirectInterval(Number(e.target.value))}
                      className="bg-black border-white/20 text-white text-xs h-9"
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-[11px] text-white/70 block mb-1">{t("Unidade:")}</label>
                    <select
                      value={directUnit}
                      onChange={(e) => setDirectUnit(e.target.value as "seconds" | "minutes")}
                      className="w-full bg-black border border-white/20 text-white rounded-md text-xs h-9 px-2 focus:outline-none focus:border-white"
                    >
                      <option value="seconds">{t("Segundos")}</option>
                      <option value="minutes">{t("Minutos")}</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="space-y-0.5">
                  <Label className="text-xs text-white font-semibold flex items-center gap-1.5">
                    <Sparkle size={14} className="text-emerald-400" />
                    {t("Simular Digitação Humana (WAHA Presence)")}
                  </Label>
                  <p className="text-[10px] text-white/60">
                    {t("Emite status \"digitando...\" proporcional ao tamanho da mensagem antes de enviar.")}
                  </p>
                </div>
                <Switch checked={simulateTyping} onCheckedChange={setSimulateTyping} />
              </div>
            </div>

            {/* 4. Anexo de Mídia (WAHA Engine) */}
            <div className="pt-5 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  {t("Anexo de Mídia (WAHA Engine)")}
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onOpenMediaLibrary}
                    className="border-white/20 text-white text-xs h-7 gap-1 hover:bg-white/10"
                  >
                    <FolderSimple size={13} />
                    {t("Biblioteca")}
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/60">{t("Anexar")}</span>
                    <Switch checked={hasMedia} onCheckedChange={setHasMedia} />
                  </div>
                </div>
              </div>

              {hasMedia && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { type: "image", label: t("Imagem") },
                      { type: "audio", label: t("Áudio (PTT)") },
                      { type: "video", label: t("Vídeo") },
                      { type: "document", label: t("Documento") },
                    ].map((btn) => (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => setMediaType(btn.type as any)}
                        className={`py-1.5 px-2 rounded text-xs font-semibold text-center border transition-all ${
                          mediaType === btn.type
                            ? "bg-white text-black border-white shadow"
                            : "bg-black text-white/70 border-white/15 hover:border-white/40"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-white/70 block mb-1">
                        {t("Upload Direto do Computador:")}
                      </label>
                      <Input
                        type="file"
                        onChange={handleDirectUpload}
                        accept="image/*,audio/*,video/*,application/pdf"
                        className="bg-black border-white/20 text-white text-xs h-9 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/70 block mb-1">
                        {t("Ou URL Direta da Mídia (HTTPS):")}
                      </label>
                      <Input
                        type="url"
                        value={mediaUrl}
                        onChange={(e) => {
                          setMediaUrl(e.target.value);
                          setMediaDataUrl(undefined);
                        }}
                        placeholder="https://exemplo.com/arquivo.jpg"
                        className="bg-black border-white/20 text-white text-xs h-9"
                      />
                    </div>
                  </div>

                  {mediaType !== "audio" && (
                    <div>
                      <label className="text-[11px] text-white/70 block mb-1">
                        {t("Legenda Opcional da Mídia:")}
                      </label>
                      <Input
                        type="text"
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        placeholder={t("Legenda anexada junto ao arquivo...")}
                        className="bg-black border-white/20 text-white text-xs h-9"
                      />
                    </div>
                  )}

                  {mediaType === "audio" && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                      <Microphone size={16} />
                      <span>
                        {t("Áudio será entregue como nota de voz oficial do WhatsApp gravada na hora (com microfone verde e waveform).")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Botões de Ação Principal de Disparo */}
            {isGroupMode ? (
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={handleDispatchGroup}
                  disabled={!selectedGroupId}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black tracking-wide text-xs sm:text-sm py-6 shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] gap-2 disabled:opacity-50"
                >
                  <UsersThree size={18} weight="bold" />
                  {t("Disparar para o Grupo WhatsApp")}
                </Button>
              </div>
            ) : (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  size="lg"
                  onClick={handleStartValidationFlow}
                  className="w-full bg-white hover:bg-white/90 text-black font-black tracking-wide text-xs sm:text-sm py-6 shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                >
                  <ShieldCheck size={18} weight="bold" />
                  {t("Validar e Disparar")}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const list = parseContactRecipients(rawContacts);
                    if (list.length === 0) {
                      alert(t("Por favor, insira pelo menos um número com DDD válido."));
                      return;
                    }
                    handleConfirmAndDispatch(list);
                  }}
                  className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-bold tracking-wide text-xs sm:text-sm py-6 shadow-xl transition-all gap-2"
                >
                  <PaperPlaneTilt size={18} weight="bold" />
                  {t("Disparar Direto")}
                </Button>
              </div>
            )}

            {/* 6. NO FINAL DO BOX: O TESTADOR EM AMARELO */}
            <div className="p-5 rounded-xl border-2 border-yellow-500/60 bg-yellow-950/20 shadow-xl space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-2">
                  <Lightning size={16} className="text-yellow-400" weight="bold" />
                  {t("Slot de Envio de Teste")}
                </Label>
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-[10px]">
                  {t("Padrão: 31998622489")}
                </Badge>
              </div>
              <p className="text-xs text-yellow-200/70">
                {t("Escolha um número em branco para disparar uma mensagem de teste antes do lote.")}
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
                  onClick={handleSendTestMessage}
                  disabled={isSendingTest}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs h-9 gap-2 shadow-lg transition-all"
                >
                  {isSendingTest ? (
                    <ArrowsClockwise size={14} className="animate-spin" />
                  ) : (
                    <Lightning size={14} weight="bold" />
                  )}
                  {t("Enviar Teste Agora")}
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

        {/* COLUNA DIREITA: REAL-TIME WHATSAPP LIVE PREVIEW (STICKY E ALINHADO) */}
        <div className="lg:col-span-5 sticky top-6">
          <WhatsAppChatPreview
            messageTemplate={messageTemplate}
            recipients={currentParsed}
            testRecipient={testContactRecipient}
            media={currentMediaAttachment}
            activeSessionPhone={sessionPhone}
          />
        </div>
      </div>

      {/* Modal de Validação Pré-Voo */}
      <ValidadorModal
        open={validatorOpen}
        onOpenChange={setValidatorOpen}
        recipients={parsedList}
        session={sessionName}
        onConfirmValidOnly={handleConfirmAndDispatch}
      />
    </div>
  );
}
