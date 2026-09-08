"use client";

import * as React from "react";

export interface WahaGroupOption {
  id: string;
  name: string;
  description?: string;
  participantsCount?: number;
}

interface UseWahaGroupsResult {
  groups: WahaGroupOption[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook para buscar grupos WhatsApp de uma sessão WAHA específica.
 * Recarrega automaticamente quando "session" muda ou quando reload() é acionado.
 * Retorna [] enquanto carrega ou se ocorrer erro.
 *
 * @param session - nome da sessão WAHA (ex: "org_dfbfd2d3_30783a")
 * @param enabled - se false, não busca (útil quando modo grupo está desativado)
 */
export function useWahaGroups(
  session: string,
  enabled: boolean = true
): UseWahaGroupsResult {
  const [groups, setGroups] = React.useState<WahaGroupOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    if (!enabled || !session) {
      setGroups([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/v1/custom-chat/groups?session=${encodeURIComponent(session)}`)
      .then((res) => res.json())
      .then((data: { ok: boolean; data?: WahaGroupOption[]; error?: string }) => {
        if (cancelled) return;
        if (data.ok && Array.isArray(data.data)) {
          setGroups(data.data);
        } else {
          setError(data.error || "Erro ao carregar lista de grupos");
          setGroups([]);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha na conexão ao carregar grupos");
        setGroups([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session, enabled, reloadKey]);

  const reload = React.useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return { groups, isLoading, error, reload };
}
