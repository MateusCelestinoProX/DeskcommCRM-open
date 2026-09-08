"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

import { useT } from "@/hooks/i18n/useT";
import { TOTPInput } from "@/components/auth/TOTPInput";
import { Button } from "@/components/ui/button";
import { verifyMfa } from "@/app/actions/auth/verifyMfa";

interface MfaFormProps {
  next?: string;
}

export function MfaForm({ next }: MfaFormProps) {
  const t = useT();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!locked || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setLocked(false);
          setError(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked, secondsLeft]);

  const submit = (codeArg?: string) => {
    const finalCode = codeArg ?? code;
    if (finalCode.length !== 6 || locked || isPending) return;
    setError(null);
    startTransition(async () => {
      const res = await verifyMfa(finalCode, next);
      if (!res) return; // Redirecionamento server-side em caso de sucesso
      if (res.error === "mfa_locked") {
        setLocked(true);
        setSecondsLeft(res.retry_in_seconds ?? 60);
        setError(
          `${t("Muitas tentativas. Aguarde")} ${res.retry_in_seconds ?? 60}s ${t("e tente novamente.")}`,
        );
        setCode("");
      } else {
        setError(t("Código incorreto ou expirado. Tente novamente."));
        setCode("");
      }
    });
  };

  const recoveryHref = next
    ? `/login/recovery?next=${encodeURIComponent(next)}`
    : "/login/recovery";

  return (
    <form
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
      noValidate
    >
      <div className="py-2">
        <TOTPInput
          value={code}
          onChange={setCode}
          onComplete={(c) => submit(c)}
          disabled={isPending || locked}
          autoFocus
          hasError={!!error}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive transition-all animate-in fade-in zoom-in-95"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {locked && secondsLeft > 0
              ? `${t("Muitas tentativas. Tente novamente em")} ${secondsLeft}s.`
              : error}
          </span>
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={isPending || locked || code.length !== 6}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t("Verificando...")}</span>
            </>
          ) : (
            <>
              <span>{t("Verificar e Acessar")}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <div className="text-center pt-2">
          <Link
            href={recoveryHref}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:underline underline-offset-4"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>{t("Perdi acesso ao autenticador")}</span>
          </Link>
        </div>
      </div>
    </form>
  );
}
