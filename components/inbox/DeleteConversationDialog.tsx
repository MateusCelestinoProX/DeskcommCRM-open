"use client";
import { useState } from "react";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteConversation } from "@/hooks/inbox/useDeleteConversation";
import { Trash, Phone, Check, CircleNotch, Warning } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

interface Props {
  conversationId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteConversationDialog({
  conversationId,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const t = useT();
  const deleteConv = useDeleteConversation();
  // "system": Apagar apenas do Sistema
  // "both": Apagar do Sistema e do WhatsApp Cloud
  const [deleteMode, setDeleteMode] = useState<"system" | "both">("system");

  function handleClose(v: boolean) {
    if (!deleteConv.isPending) {
      setDeleteMode("system");
      onOpenChange(v);
    }
  }

  function handleConfirmDelete() {
    deleteConv.mutate(
      {
        conversation_id: conversationId,
        delete_whatsapp: deleteMode === "both",
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDeleted?.();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
              <Trash size={18} weight="bold" />
            </div>
            <DialogTitle className="text-base sm:text-lg">
              {t("Apagar conversa")}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-1 text-sm text-muted-foreground">
            {t(
              "Esta ação é irreversível e excluirá o histórico de mensagens, notas e dados desta conversa. Escolha a abrangência da exclusão abaixo:",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Opção 1: Apagar do Sistema */}
          <button
            type="button"
            onClick={() => setDeleteMode("system")}
            className={cn(
              "flex w-full items-start gap-3.5 rounded-lg border p-3.5 text-left transition-all",
              deleteMode === "system"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-muted-foreground/30 hover:bg-accent/40",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                deleteMode === "system"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40",
              )}
            >
              {deleteMode === "system" && <Check size={12} weight="bold" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {t("Apagar do Sistema")}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {t("Padrão")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t(
                  "Exclui todo o histórico desta conversa, mensagens e notas do CRM. O histórico no aplicativo WhatsApp do contato e da empresa permanece intacto.",
                )}
              </p>
            </div>
          </button>

          {/* Opção 2: Apagar do Sistema e do WhatsApp Cloud */}
          <button
            type="button"
            onClick={() => setDeleteMode("both")}
            className={cn(
              "flex w-full items-start gap-3.5 rounded-lg border p-3.5 text-left transition-all",
              deleteMode === "both"
                ? "border-destructive bg-destructive/5 ring-1 ring-destructive"
                : "border-border hover:border-destructive/40 hover:bg-destructive/5",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                deleteMode === "both"
                  ? "border-destructive bg-destructive text-destructive-foreground"
                  : "border-muted-foreground/40",
              )}
            >
              {deleteMode === "both" && <Check size={12} weight="bold" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-destructive">
                  {t("Apagar do Sistema e do WhatsApp Cloud")}
                </span>
                <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                  {t("Completo")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t(
                  "Exclui todo o histórico do CRM e também envia o comando via WAHA para apagar o chat diretamente no WhatsApp da empresa no aparelho/servidor.",
                )}
              </p>
            </div>
          </button>

          {deleteMode === "both" && (
            <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Warning size={15} weight="fill" className="mt-0.5 shrink-0" />
              <span>
                {t(
                  "Atenção: Ao confirmar, o chat será deletado no aparelho do WhatsApp corporativo associado à instância desta conversa.",
                )}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            disabled={deleteConv.isPending}
            onClick={() => handleClose(false)}
          >
            {t("Cancelar")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteConv.isPending}
            onClick={handleConfirmDelete}
            className="gap-1.5"
          >
            {deleteConv.isPending ? (
              <>
                <CircleNotch size={14} className="animate-spin" />
                {t("Apagando conversa…")}
              </>
            ) : (
              <>
                <Trash size={14} />
                {deleteMode === "both"
                  ? t("Apagar do Sistema e WhatsApp")
                  : t("Apagar do Sistema")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
