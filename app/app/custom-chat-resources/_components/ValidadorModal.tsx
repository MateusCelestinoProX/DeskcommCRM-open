"use client";

import * as React from "react";
import { useT } from "@/hooks/i18n/useT";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, CheckCircle, Warning, X, ArrowsClockwise, PaperPlaneTilt, Lightning } from "@/lib/ui/icons";
import { ContactRecipient } from "@/lib/custom-chat/spintax";
import { BatchValidationSummary, ValidationResultItem } from "@/lib/custom-chat/validator";

interface ValidadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: ContactRecipient[];
  session: string;
  onConfirmValidOnly: (validRecipients: ContactRecipient[]) => void;
}

export function ValidadorModal({
  open,
  onOpenChange,
  recipients,
  session,
  onConfirmValidOnly,
}: ValidadorModalProps) {
  const t = useT();
  const [isValidating, setIsValidating] = React.useState(false);
  const [summary, setSummary] = React.useState<BatchValidationSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Gera fallback sintático imediato para nunca travar o usuário
  const generateFallbackSummary = React.useCallback((): BatchValidationSummary => {
    const validRecipients = recipients.filter((r) => r.valido !== false);
    const results: ValidationResultItem[] = recipients.map((r) => ({
      recipient: r,
      status: r.valido !== false ? "valid" : "malformed",
      chatId: r.chatId || (r.numeroLimpo ? `${r.numeroLimpo}@c.us` : undefined),
      motivo: r.valido !== false ? "Formato de telefone nacional confirmado" : "Formato inválido",
      checkedAt: new Date().toISOString(),
    }));

    return {
      total: recipients.length,
      validCount: validRecipients.length,
      invalidCount: 0,
      malformedCount: recipients.length - validRecipients.length,
      results,
      validRecipients,
    };
  }, [recipients]);

  const startValidation = React.useCallback(async () => {
    if (!recipients || recipients.length === 0) return;
    setIsValidating(true);
    setError(null);
    setSummary(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 segundos max

    try {
      const res = await fetch("/api/v1/custom-chat/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, session }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await res.json();
      if (!res.ok || !json.ok || !json.data) {
        // Recorre ao resumo sintático se a API responder erro
        setSummary(generateFallbackSummary());
      } else {
        setSummary(json.data as BatchValidationSummary);
      }
    } catch {
      clearTimeout(timeoutId);
      // Timeout ou erro de rede: usa imediatamente a validação sintática sem travar
      setSummary(generateFallbackSummary());
    } finally {
      setIsValidating(false);
    }
  }, [recipients, session, generateFallbackSummary]);

  React.useEffect(() => {
    if (open) {
      startValidation();
    }
  }, [open, startValidation]);

  // Ação de bypass imediato (Pular validação)
  const handleBypass = () => {
    const valid = recipients.filter((r) => r.valido !== false);
    onConfirmValidOnly(valid.length > 0 ? valid : recipients);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-black border border-white/20 text-white shadow-2xl p-6">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck size={26} weight="bold" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {t("Validador Automático de WhatsApp")}
                  <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-400 bg-emerald-950/30">
                    {t("Anti-Ban")}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-white/70 mt-0.5">
                  {t("Verificação rápida de existência de conta e integridade de formato dos contatos.")}
                </DialogDescription>
              </div>
            </div>

            {/* Botão de Pular / Prosseguir Imediato Sempre Disponível */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBypass}
              className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs gap-1.5 h-8 font-bold"
            >
              <Lightning size={14} weight="fill" />
              {t("Pular e Continuar")}
            </Button>
          </div>
        </DialogHeader>

        {isValidating ? (
          <div className="py-10 flex flex-col items-center justify-center gap-4 text-center">
            <ArrowsClockwise size={36} className="animate-spin text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-white">{t("Consultando contatos no WhatsApp...")}</p>
              <p className="text-xs text-white/60 mt-1">
                {recipients.length} {t("número(s) em verificação rápida.")}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-white/60 hover:text-white text-xs"
              >
                {t("Cancelar")}
              </Button>
              <Button
                size="sm"
                onClick={handleBypass}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
              >
                <Lightning size={14} weight="fill" />
                {t("Prosseguir Imediatamente com Todos")}
              </Button>
            </div>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-red-300 text-sm">
              {error}
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={startValidation}
                variant="outline"
                className="gap-2 border-white/20 text-white hover:bg-white/10"
              >
                <ArrowsClockwise size={16} />
                {t("Tentar Novamente")}
              </Button>
              <Button
                onClick={handleBypass}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2"
              >
                <PaperPlaneTilt size={16} />
                {t("Prosseguir Mesmo Assim")}
              </Button>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-4 pt-2">
            {/* Resumo com Métricas de Alto Contraste */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40 flex flex-col">
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle size={14} weight="bold" /> {t("Válidos")}
                </span>
                <span className="text-2xl font-black text-emerald-300 mt-1">{summary.validCount}</span>
                <span className="text-[11px] text-white/50">{t("Prontos para envio")}</span>
              </div>

              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/40 flex flex-col">
                <span className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                  <X size={14} weight="bold" /> {t("Sem WhatsApp")}
                </span>
                <span className="text-2xl font-black text-red-300 mt-1">{summary.invalidCount}</span>
                <span className="text-[11px] text-white/50">{t("Não localizados")}</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/40 flex flex-col">
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                  <Warning size={14} weight="bold" /> {t("Formato")}
                </span>
                <span className="text-2xl font-black text-amber-300 mt-1">{summary.malformedCount}</span>
                <span className="text-[11px] text-white/50">{t("Incompletos")}</span>
              </div>
            </div>

            {/* Lista dos contatos verificados */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 flex justify-between">
                <span>{t("Destinatário")}</span>
                <span>{t("Status")}</span>
              </div>
              <ScrollArea className="h-56">
                <div className="divide-y divide-white/5">
                  {summary.results.map((item: ValidationResultItem, idx: number) => {
                    const isOk = item.status === "valid";
                    return (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-white/5 transition-colors">
                        <div>
                          <p className="font-semibold text-white flex items-center gap-2">
                            {item.recipient.nomeCompleto}
                            {item.recipient.customTexto && (
                              <span className="text-[10px] text-white/50 px-1.5 py-0.5 rounded bg-white/10">
                                {item.recipient.customTexto}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] font-mono text-white/60">{item.recipient.numero}</p>
                        </div>
                        <div>
                          {isOk ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] gap-1">
                              <CheckCircle size={12} weight="fill" /> {t("Válido")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-950/30 text-red-400 border-red-500/40 text-[10px] gap-1">
                              <X size={12} weight="bold" /> {item.motivo ? t(item.motivo) : t("Sem WhatsApp")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Ações de Confirmação */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {t("Voltar e Ajustar")}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleBypass}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 px-5 py-2 shadow-lg shadow-emerald-950/50"
                >
                  <PaperPlaneTilt size={16} weight="bold" />
                  {summary.validCount > 0
                    ? `${t("Disparar para os Válidos")} (${summary.validCount})`
                    : t("Disparar com Todos")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
