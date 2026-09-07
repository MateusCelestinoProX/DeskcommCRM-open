"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { showApiError } from "@/components/feedback/ApiErrorToast";
import { toast } from "sonner";
import { useT } from "@/hooks/i18n/useT";

interface DeleteConversationArgs {
  conversation_id: string;
  delete_whatsapp: boolean;
}

interface DeleteConversationResponse {
  data: {
    success: boolean;
    deleted_whatsapp: boolean;
    waha_status?: string;
  };
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: async ({ conversation_id, delete_whatsapp }: DeleteConversationArgs) => {
      const qs = delete_whatsapp ? "?delete_whatsapp=true" : "?delete_whatsapp=false";
      return apiClient.delete<DeleteConversationResponse>(
        `/api/v1/conversations/${conversation_id}${qs}`,
      );
    },
    onError: (err, args) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", args.conversation_id] });
      showApiError(err);
    },
    onSuccess: (_res, args) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.removeQueries({ queryKey: ["conversation", args.conversation_id] });
      if (args.delete_whatsapp) {
        toast.success(t("Conversa apagada do sistema e do WhatsApp com sucesso!"));
      } else {
        toast.success(t("Conversa apagada do sistema com sucesso!"));
      }
    },
  });
}
