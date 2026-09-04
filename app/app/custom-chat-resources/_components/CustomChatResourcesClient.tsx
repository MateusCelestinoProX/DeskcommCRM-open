"use client";

import * as React from "react";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarBlank,
  PaperPlaneTilt,
  PlugsConnected,
  FolderSimple,
  Monitor,
  Warning,
  ArrowsClockwise,
  Trash,
} from "@/lib/ui/icons";
import { DisparadorView } from "./DisparadorView";
import { AgendadorView } from "./AgendadorView";
import { MediaManagerView } from "./MediaManagerView";
import { MonitorView, MonitorItem } from "./MonitorView";
import { MediaAttachment } from "@/lib/custom-chat/waha-dispatcher";

export interface WahaSessionItem {
  name: string;
  status: string;
  phone?: string;
  pushName?: string;
}

export function CustomChatResourcesClient() {
  const t = useT();

  // Módulo Ativo: Disparador, Agendador, Mídia ou Monitor
  const [activeModule, setActiveModule] = React.useState<"disparador" | "agendador" | "media" | "monitor">("disparador");

  // Sessões WAHA e Instância Ativa
  const [sessionsList, setSessionsList] = React.useState<WahaSessionItem[]>([]);
  const [selectedSessionName, setSelectedSessionName] = React.useState<string>("org_dfbfd2d3");

  const activeSession = React.useMemo<WahaSessionItem>(() => {
    const found = sessionsList.find((s) => s.name === selectedSessionName);
    if (found) return found;
    if (sessionsList.length > 0) return sessionsList[0]!;
    return {
      name: selectedSessionName,
      status: "WORKING",
      phone: "553175023319",
      pushName: "Carla Regina",
    };
  }, [sessionsList, selectedSessionName]);

  // Mídia selecionada da biblioteca para uso no Disparador e Agendador
  const [selectedMediaForDisparador, setSelectedMediaForDisparador] = React.useState<MediaAttachment | undefined>(undefined);
  const [selectedMediaForAgendador, setSelectedMediaForAgendador] = React.useState<MediaAttachment | undefined>(undefined);

  // ESTADO COMPARTILHADO DO MONITOR
  const [monitorItems, setMonitorItems] = React.useState<MonitorItem[]>([]);
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false);
  const [isPaused, setIsPaused] = React.useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = React.useState<number | null>(null);

  // Configuração ativa da rodada
  const [dispatchConfig, setDispatchConfig] = React.useState<{
    template: string;
    media?: MediaAttachment;
    simulateTyping: boolean;
    spacingMode: "direct" | "alternating";
    directInterval: number;
    directUnit: "seconds" | "minutes";
    minInterval: number;
    maxInterval: number;
  }>({
    template: "",
    simulateTyping: true,
    spacingMode: "alternating",
    directInterval: 10,
    directUnit: "seconds",
    minInterval: 15,
    maxInterval: 45,
  });

  const isPausedRef = React.useRef(false);
  const isCancelledRef = React.useRef(false);
  // Ref para evitar stale closure no runDispatchLoop — sempre lê a sessão atual
  const activeSessionRef = React.useRef(activeSession);
  React.useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  React.useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const [isCleaningInstances, setIsCleaningInstances] = React.useState<boolean>(false);
  const [cleanResult, setCleanResult] = React.useState<string | null>(null);

  // Carrega e recarrega periodicamente a lista de todas as sessões do WAHA
  const loadSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/custom-chat/sessions");
      const json = await res.json();
      if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
        setSessionsList(json.data);
        setSelectedSessionName((current) => {
          const exists = json.data.some((s: WahaSessionItem) => s.name === current);
          if (exists) return current;
          const working = json.data.find((s: WahaSessionItem) => s.status === "WORKING") || json.data[0];
          return working ? working.name : current;
        });
      }
    } catch {
      // Mantém fallback seguro
    }
  }, []);

  // Carrega na montagem e recarrega a cada 20 segundos
  React.useEffect(() => {
    loadSession();
    const interval = setInterval(loadSession, 20000);
    return () => clearInterval(interval);
  }, [loadSession]);

  // Limpar instâncias não-conectadas
  const handleCleanInstances = async () => {
    setIsCleaningInstances(true);
    setCleanResult(null);
    try {
      const res = await fetch("/api/v1/custom-chat/sessions", { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setCleanResult(json.message || t("Instâncias limpas com sucesso"));
        // Recarrega a sessão após limpeza
        await loadSession();
      } else {
        setCleanResult(`Erro: ${json.error || t("Falha na limpeza")}`);
      }
    } catch (err: unknown) {
      setCleanResult(err instanceof Error ? err.message : t("Falha de conexão"));
    } finally {
      setIsCleaningInstances(false);
    }
  };

  // Loop de disparo para execução da fila
  const runDispatchLoop = React.useCallback(
    async (
      itemsToDispatch: MonitorItem[],
      config: typeof dispatchConfig,
    ) => {
      setIsExecuting(true);
      setIsPaused(false);
      isPausedRef.current = false;
      isCancelledRef.current = false;

      for (let i = 0; i < itemsToDispatch.length; i++) {
        if (isCancelledRef.current) break;

        const currentItem = itemsToDispatch[i];
        if (!currentItem) continue;

        // Se já foi enviado manualmente pelo "Enviar Agora", pula
        if (currentItem.status === "success") continue;

        // Se pausado, aguarda
        while (isPausedRef.current) {
          await new Promise((r) => setTimeout(r, 500));
          if (isCancelledRef.current) break;
        }
        if (isCancelledRef.current) break;

        // Marca status como typing
        setMonitorItems((prev) =>
          prev.map((it) =>
            it.id === currentItem.id ? { ...it, status: "typing" } : it,
          ),
        );

        try {
          // Usa ref para garantir a sessão ATUAL (evita stale closure)
          const currentSession = activeSessionRef.current.name;
          const res = await fetch("/api/v1/custom-chat/dispatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "send-single",
              session: currentSession,
              recipient: currentItem.recipient,
              template: config.template,
              media: config.media,
              simulateTyping: config.simulateTyping,
            }),
          });

          const json = await res.json();

          if (!res.ok || !json.ok) {
            const errMsg = json.error || t("Erro no envio pelo WAHA");
            setMonitorItems((prev) =>
              prev.map((it) =>
                it.id === currentItem.id
                  ? { ...it, status: "error", detail: errMsg }
                  : it,
              ),
            );

            // Se for restrição 463 Reachout Timelock da Meta, pausa automaticamente
            if (json.data?.result?.isTimelock) {
              isPausedRef.current = true;
              setIsPaused(true);
              alert(
                t(
                  "ALERTA META 463: Restrição temporária de reachout detectada no WhatsApp. A fila foi pausada automaticamente para proteger o número.",
                ),
              );
              break;
            }
          } else {
            const timeStr = new Date().toLocaleTimeString();
            setMonitorItems((prev) =>
              prev.map((it) =>
                it.id === currentItem.id
                  ? {
                      ...it,
                      status: "success",
                      detail: `${t("Entregue às")} ${timeStr}`,
                    }
                  : it,
              ),
            );
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : t("Falha de rede");
          setMonitorItems((prev) =>
            prev.map((it) =>
              it.id === currentItem.id
                ? { ...it, status: "error", detail: errMsg }
                : it,
            ),
          );
        }

        // Intervalo de Pacing Inteligente entre disparos (somente se não for o último item)
        if (i < itemsToDispatch.length - 1) {
          let waitSeconds = 15;

          if (config.spacingMode === "direct") {
            const base = config.directInterval || 10;
            waitSeconds = config.directUnit === "minutes" ? base * 60 : base;
          } else {
            // Alternado / Aleatório Orgânico
            const min = config.minInterval || 15;
            const max = config.maxInterval || 45;
            waitSeconds = Math.floor(Math.random() * (max - min + 1)) + min;
          }

          // Contagem regressiva visual segundo a segundo
          for (let s = waitSeconds; s > 0; s--) {
            if (isCancelledRef.current) break;
            while (isPausedRef.current) {
              await new Promise((r) => setTimeout(r, 500));
              if (isCancelledRef.current) break;
            }
            setCountdownSeconds(s);
            await new Promise((r) => setTimeout(r, 1000));
          }
          setCountdownSeconds(null);
        }
      }

      setIsExecuting(false);
      setCountdownSeconds(null);
    },
    // Não incluir activeSession.name aqui — usamos activeSessionRef para evitar
    // interrupções e stale closures. O ref é atualizado via useEffect separado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  // Iniciar Monitor a partir do Disparador
  const handleStartMonitor = (
    items: MonitorItem[],
    config: typeof dispatchConfig,
  ) => {
    setMonitorItems(items);
    setDispatchConfig(config);
    setActiveModule("monitor"); // Comuta automaticamente para o Dashboard do Monitor
    runDispatchLoop(items, config);
  };

  // Botão "Enviar Agora" em um contato específico (quebra o pacing e envia imediatamente)
  const handleSendNowSingle = async (targetItem: MonitorItem) => {
    // Marca como enviando
    setMonitorItems((prev) =>
      prev.map((it) =>
        it.id === targetItem.id ? { ...it, status: "typing" } : it,
      ),
    );

    try {
      const res = await fetch("/api/v1/custom-chat/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-single",
          session: activeSessionRef.current.name,
          recipient: targetItem.recipient,
          template: dispatchConfig.template || targetItem.generatedText,
          text: targetItem.generatedText || undefined,
          media: dispatchConfig.media,
          simulateTyping: dispatchConfig.simulateTyping,
        }),
      });

      const json = await res.json();
      const timeStr = new Date().toLocaleTimeString();

      if (json.ok && json.data?.result?.success) {
        setMonitorItems((prev) =>
          prev.map((it) =>
            it.id === targetItem.id
              ? {
                  ...it,
                  status: "success",
                  detail: t("Enviado agora manualmente"),
                  sentAt: timeStr,
                }
              : it,
          ),
        );
      } else {
        const err =
          json.error || json.data?.result?.error || t("Erro no envio imediato");
        setMonitorItems((prev) =>
          prev.map((it) =>
            it.id === targetItem.id
              ? { ...it, status: "error", detail: err }
              : it,
          ),
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("Falha de rede");
      setMonitorItems((prev) =>
        prev.map((it) =>
          it.id === targetItem.id
            ? { ...it, status: "error", detail: msg }
            : it,
        ),
      );
    }
  };

  const handlePauseToggle = () => {
    setIsPaused((p) => !p);
  };

  const handleCancelDispatch = () => {
    isCancelledRef.current = true;
    setIsPaused(false);
    setIsExecuting(false);
    setCountdownSeconds(null);
  };

  // Polling de 10 segundos para processar agendamentos no backend automaticamente
  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetch("/api/v1/custom-chat/schedules");
      } catch {
        // Silencioso
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior com os 4 Botões Principais */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-black border border-white/20 shadow-2xl">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão 1: Disparador */}
          <Button
            size="lg"
            onClick={() => setActiveModule("disparador")}
            className={`gap-2.5 px-6 py-5 text-xs md:text-sm font-bold tracking-wide transition-all ${
              activeModule === "disparador"
                ? "bg-white text-black shadow-xl shadow-white/10 hover:bg-white/95 scale-[1.02]"
                : "bg-black text-white/70 border border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <PaperPlaneTilt size={18} weight="bold" />
            {t("Disparador")}
          </Button>

          {/* Botão 2: Agendador */}
          <Button
            size="lg"
            onClick={() => setActiveModule("agendador")}
            className={`gap-2.5 px-6 py-5 text-xs md:text-sm font-bold tracking-wide transition-all ${
              activeModule === "agendador"
                ? "bg-white text-black shadow-xl shadow-white/10 hover:bg-white/95 scale-[1.02]"
                : "bg-black text-white/70 border border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <CalendarBlank size={18} weight="bold" />
            {t("Agendador")}
          </Button>

          {/* Botão 3: Mídia */}
          <Button
            size="lg"
            onClick={() => setActiveModule("media")}
            className={`gap-2.5 px-6 py-5 text-xs md:text-sm font-bold tracking-wide transition-all ${
              activeModule === "media"
                ? "bg-white text-black shadow-xl shadow-white/10 hover:bg-white/95 scale-[1.02]"
                : "bg-black text-white/70 border border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <FolderSimple size={18} weight="bold" />
            {t("Mídia")}
          </Button>

          {/* Botão 4: Monitor */}
          <Button
            size="lg"
            onClick={() => setActiveModule("monitor")}
            className={`gap-2.5 px-6 py-5 text-xs md:text-sm font-bold tracking-wide transition-all relative ${
              activeModule === "monitor"
                ? "bg-white text-black shadow-xl shadow-white/10 hover:bg-white/95 scale-[1.02]"
                : "bg-black text-white/70 border border-white/20 hover:border-white hover:text-white"
            }`}
          >
            <Monitor size={18} weight="bold" />
            {t("Monitor")}
            {isExecuting && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
            )}
          </Button>
        </div>

        {/* Seletor de Instância WAHA Ativa com Dropdown Interativo */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={[
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border bg-black transition-colors",
            activeSession.status === "WORKING" ? "border-emerald-500/40" : "border-amber-500/40",
          ].join(" ")}>
            <PlugsConnected size={15} className={activeSession.status === "WORKING" ? "text-emerald-400" : "text-amber-400"} />
            <span className="text-white/70 font-semibold">{t("Instância:")}</span>
            <select
              value={selectedSessionName}
              onChange={(e) => setSelectedSessionName(e.target.value)}
              className="bg-black text-white font-mono text-xs border-0 focus:ring-0 focus:outline-none cursor-pointer pr-1"
              title={t("Selecione a instância WhatsApp conectada para envios")}
            >
              {sessionsList.map((s) => (
                <option key={s.name} value={s.name} className="bg-neutral-900 text-white font-mono">
                  {s.phone ? `+${s.phone}` : s.name} {s.pushName ? `(${s.pushName})` : ""} · [{s.status}]
                </option>
              ))}
              {sessionsList.length === 0 && (
                <option value={selectedSessionName} className="bg-neutral-900 text-white font-mono">
                  {selectedSessionName}
                </option>
              )}
            </select>
            <Badge className={`text-[10px] py-0 font-mono ${
              activeSession.status === "WORKING"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
            }`}>
              {activeSession.status}
            </Badge>
          </div>

          {/* Aviso quando sessão não está WORKING */}
          {activeSession.status !== "WORKING" && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-[11px]">
              <Warning size={13} weight="bold" />
              <span>{t("Instância selecionada não está conectada.")}</span>
            </div>
          )}

          {/* Botão de refresh da sessão */}
          <button
            type="button"
            onClick={() => void loadSession()}
            className="p-1.5 rounded-lg bg-white/5 border border-white/15 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title={t("Atualizar lista de instâncias")}
          >
            <ArrowsClockwise size={13} />
          </button>

          {/* Botão para limpar instâncias não-conectadas */}
          <button
            type="button"
            onClick={() => void handleCleanInstances()}
            disabled={isCleaningInstances}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-950/50 hover:border-red-500/60 text-[11px] font-semibold transition-colors disabled:opacity-50"
            title={t("Excluir instâncias WAHA não-conectadas (corrompidas/órfãs)")}
          >
            <Trash size={11} />
            {isCleaningInstances ? t("Limpando...") : t("Limpar Instâncias")}
          </button>

          {/* Resultado da limpeza */}
          {cleanResult && (
            <span className="text-[11px] text-white/70 max-w-xs truncate" title={cleanResult}>
              {cleanResult}
            </span>
          )}
        </div>
      </div>

      {/* Renderização Persistente dos Módulos (Zero perda de estado ao alternar abas ou galeria) */}
      <div className={activeModule === "disparador" ? "block" : "hidden"}>
        <DisparadorView
          sessionName={activeSession.name}
          sessionPhone={activeSession.phone}
          availableSessions={sessionsList}
          onSelectSession={setSelectedSessionName}
          onStartMonitor={handleStartMonitor}
          onOpenMediaLibrary={() => setActiveModule("media")}
          selectedMediaFromLibrary={selectedMediaForDisparador}
        />
      </div>

      <div className={activeModule === "agendador" ? "block" : "hidden"}>
        <AgendadorView
          sessionName={activeSession.name}
          sessionPhone={activeSession.phone}
          availableSessions={sessionsList}
          onSelectSession={setSelectedSessionName}
          selectedMediaFromLibrary={selectedMediaForAgendador}
          onOpenMediaLibrary={() => setActiveModule("media")}
        />
      </div>

      <div className={activeModule === "media" ? "block" : "hidden"}>
        <MediaManagerView
          onSelectForDisparador={(media) => {
            setSelectedMediaForDisparador(media);
            setActiveModule("disparador");
          }}
          onSelectForAgendador={(media) => {
            setSelectedMediaForAgendador(media);
            setActiveModule("agendador");
          }}
        />
      </div>

      <div className={activeModule === "monitor" ? "block" : "hidden"}>
        <MonitorView
          sessionName={activeSession.name}
          sessionPhone={activeSession.phone}
          items={monitorItems}
          isExecuting={isExecuting}
          isPaused={isPaused}
          countdownSeconds={countdownSeconds}
          template={dispatchConfig.template}
          media={dispatchConfig.media}
          simulateTyping={dispatchConfig.simulateTyping}
          onPauseToggle={handlePauseToggle}
          onCancel={handleCancelDispatch}
          onSendNowSingle={handleSendNowSingle}
          onStartDispatchWithList={() =>
            runDispatchLoop(monitorItems, dispatchConfig)
          }
        />
      </div>
    </div>
  );
}
