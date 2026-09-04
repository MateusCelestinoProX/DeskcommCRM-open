"use client";

import * as React from "react";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PaperPlaneTilt,
  Play,
  Pause,
  X,
  CheckCircle,
  Warning,
  Clock,
  ArrowsClockwise,
  ShieldCheck,
  Lightning,
} from "@/lib/ui/icons";
import { ContactRecipient, generateUniqueMessage } from "@/lib/custom-chat/spintax";
import { MediaAttachment } from "@/lib/custom-chat/waha-dispatcher";

export type MonitorContactStatus = "pending" | "typing" | "success" | "error";

export interface MonitorItem {
  id: string;
  recipient: ContactRecipient;
  status: MonitorContactStatus;
  detail?: string;
  sentAt?: string;
  generatedText: string;
}

interface MonitorViewProps {
  sessionName: string;
  sessionPhone?: string;
  items: MonitorItem[];
  isExecuting: boolean;
  isPaused: boolean;
  countdownSeconds: number | null;
  template: string;
  media?: MediaAttachment;
  simulateTyping: boolean;
  onPauseToggle: () => void;
  onCancel: () => void;
  onSendNowSingle: (item: MonitorItem) => Promise<void>;
  onStartDispatchWithList?: () => void;
}

export function MonitorView({
  sessionName,
  sessionPhone,
  items,
  isExecuting,
  isPaused,
  countdownSeconds,
  template,
  media,
  simulateTyping,
  onPauseToggle,
  onCancel,
  onSendNowSingle,
  onStartDispatchWithList,
}: MonitorViewProps) {
  const t = useT();

  const [sendingId, setSendingId] = React.useState<string | null>(null);

  // Métricas calculadas
  const totalCount = items.length;
  const successCount = items.filter((i) => i.status === "success").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const pendingCount = items.filter((i) => i.status === "pending" || i.status === "typing").length;

  const percentCompleted = totalCount > 0 ? Math.round(((successCount + errorCount) / totalCount) * 100) : 0;

  // Disparo manual avulso via "Enviar Agora"
  const handleTriggerSendNow = async (item: MonitorItem) => {
    if (sendingId) return;
    setSendingId(item.id);
    try {
      await onSendNowSingle(item);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Minimalista e Elegante do Monitor */}
      <div className="p-5 rounded-xl bg-black border border-white/20 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/15 text-white">
            <ShieldCheck size={26} weight="bold" className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                {t("Monitor de Disparos em Tempo Real")}
              </h3>
              {isExecuting ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] animate-pulse">
                  {isPaused ? t("Pausado") : t("Em Execução")}
                </Badge>
              ) : (
                <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">
                  {totalCount > 0 && pendingCount === 0 ? t("Finalizado") : t("Pronto / Aguardando")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              {t("Acompanhamento minucioso de cada número, status visual e controle manual com 'Enviar Agora'.")}
            </p>
          </div>
        </div>

        {/* Controles de Execução */}
        <div className="flex items-center gap-2.5">
          {isExecuting && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onPauseToggle}
                className="border-white/20 text-white hover:bg-white/10 text-xs h-9 gap-1.5"
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                {isPaused ? t("Retomar Disparo") : t("Pausar Disparo")}
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={onCancel}
                className="text-xs h-9 gap-1.5"
              >
                <X size={14} />
                {t("Cancelar Fila")}
              </Button>
            </>
          )}

          {!isExecuting && totalCount > 0 && pendingCount > 0 && onStartDispatchWithList && (
            <Button
              size="sm"
              onClick={onStartDispatchWithList}
              className="bg-white hover:bg-white/90 text-black font-bold text-xs h-9 gap-1.5 shadow"
            >
              <Play size={14} weight="bold" />
              {t("Iniciar Disparo da Fila")}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards de Métricas e Pacing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Selecionados */}
        <div className="p-4 rounded-xl bg-black border border-white/15 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
            {t("Total de Números")}
          </span>
          <p className="text-2xl font-black text-white font-mono">{totalCount}</p>
        </div>

        {/* Sucesso (Verde) */}
        <div className="p-4 rounded-xl bg-black border border-emerald-500/30 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              {t("Enviados com Sucesso")}
            </span>
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{successCount}</p>
        </div>

        {/* Pendentes / Faltando (Amarelo Suave) */}
        <div className="p-4 rounded-xl bg-black border border-yellow-500/30 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-yellow-300 tracking-wider">
              {t("Falta Disparar (Fila)")}
            </span>
            <Clock size={16} className="text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-yellow-300 font-mono">{pendingCount}</p>
        </div>

        {/* Erros (Vermelho) */}
        <div className="p-4 rounded-xl bg-black border border-red-500/30 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
              {t("Erros / Rejeições")}
            </span>
            <Warning size={16} className="text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400 font-mono">{errorCount}</p>
        </div>
      </div>

      {/* Barra de Progresso e Notificação de Jitter */}
      <div className="p-4 rounded-xl bg-black border border-white/20 shadow-xl space-y-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-white/70">
            {t("Progresso Geral:")} <strong className="text-white">{successCount + errorCount}</strong> / {totalCount} {t("concluídos")}
          </span>
          <span className="font-bold text-emerald-400">{percentCompleted}%</span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${percentCompleted}%` }}
          />
        </div>

        {/* Contagem regressiva de Jitter entre mensagens */}
        {countdownSeconds !== null && (
          <div className="p-3 rounded-lg bg-yellow-950/20 border border-yellow-500/30 flex items-center justify-between text-xs text-yellow-200">
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-yellow-400 animate-spin" />
              {t("Intervalo de segurança ativo (Anti-bloqueio):")}
            </span>
            <span className="font-mono font-bold text-yellow-300 text-sm">
              {t("Próximo disparo em")} {countdownSeconds}s
            </span>
          </div>
        )}
      </div>

      {/* Tabela / Lista Detalhada de Todos os Números */}
      <div className="p-5 rounded-xl bg-black border border-white/20 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            {t("Fila de Destinatários e Status Individual")}
          </h4>
          <span className="text-xs text-white/50 font-mono">
            {totalCount} {t("contatos na rodada")}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center text-white/50 space-y-2">
            <PaperPlaneTilt size={36} className="mx-auto opacity-30" />
            <p className="text-xs">{t("Nenhum disparo iniciado no momento.")}</p>
            <p className="text-[11px] text-white/40">
              {t("Vá até o Disparador, insira seus números e clique em 'Começar Disparo'.")}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const isSendingThis = sendingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    item.status === "success"
                      ? "bg-emerald-950/10 border-emerald-500/30"
                      : item.status === "error"
                      ? "bg-red-950/10 border-red-500/30"
                      : item.status === "typing"
                      ? "bg-blue-950/20 border-blue-500/40"
                      : "bg-white/5 border-white/10 hover:border-white/25"
                  }`}
                >
                  {/* Dados do Contato e Status */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <span className="text-xs font-mono text-white/40 w-6">#{idx + 1}</span>

                    {/* Status Pill */}
                    {item.status === "pending" && (
                      <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30 text-[10px] py-0.5 px-2 font-medium">
                        <Clock size={11} className="mr-1" />
                        {t("Pendente")}
                      </Badge>
                    )}

                    {item.status === "typing" && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] py-0.5 px-2 animate-pulse font-medium">
                        <ArrowsClockwise size={11} className="mr-1 animate-spin" />
                        {t("Enviando...")}
                      </Badge>
                    )}

                    {item.status === "success" && (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 text-[10px] py-0.5 px-2 font-medium">
                        <CheckCircle size={11} className="mr-1" />
                        {t("Enviado")}
                      </Badge>
                    )}

                    {item.status === "error" && (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/40 text-[10px] py-0.5 px-2 font-medium">
                        <Warning size={11} className="mr-1" />
                        {t("Erro")}
                      </Badge>
                    )}

                    <div>
                      <p className="text-xs font-bold text-white leading-tight">
                        {item.recipient.nomeCompleto}
                      </p>
                      <p className="text-[11px] font-mono text-white/60">
                        {item.recipient.numeroFormatado || item.recipient.numero}
                      </p>
                    </div>
                  </div>

                  {/* Mensagem exata que o contato receberá */}
                  <div className="flex-1 text-xs text-white/70 italic truncate max-w-md font-sans bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    &ldquo;{item.generatedText}&rdquo;
                  </div>

                  {/* Detalhes ou Hora de Envio */}
                  <div className="text-right text-[11px] font-mono text-white/50 shrink-0">
                    {item.sentAt && <span>{item.sentAt}</span>}
                    {item.detail && (
                      <span
                        className={`block text-[10px] truncate max-w-[150px] ${
                          item.status === "error" ? "text-red-400" : "text-emerald-400"
                        }`}
                        title={item.detail}
                      >
                        {item.detail}
                      </span>
                    )}
                  </div>

                  {/* Botão ENVIAR AGORA: Quebra a lógica individual para envio imediato */}
                  <div className="shrink-0 flex items-center justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSendingThis || item.status === "typing"}
                      onClick={() => handleTriggerSendNow(item)}
                      className={`h-8 px-3 text-xs gap-1.5 font-bold transition-all ${
                        item.status === "success"
                          ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-black shadow"
                          : "border-white/30 text-white hover:bg-white hover:text-black hover:border-white shadow"
                      }`}
                      title={t("Quebrar a lógica de espera e enviar imediatamente para este contato")}
                    >
                      {isSendingThis ? (
                        <ArrowsClockwise size={13} className="animate-spin" />
                      ) : (
                        <Lightning size={13} weight="bold" className="text-yellow-400" />
                      )}
                      {t("Enviar Agora")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
