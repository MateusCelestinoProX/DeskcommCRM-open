import { redirect } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { MfaForm } from "@/components/auth/MfaForm";
import { normalizarIdioma } from "@/lib/i18n/idiomas";
import { traduzir } from "@/lib/i18n/dicionario";

export const metadata = { title: "Verificação em duas etapas" };

export default async function MfaChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const hasVerified = !!factorsData?.totp?.some((f) => f.status === "verified");
  if (!hasVerified) redirect("/app/inbox");

  const idioma = normalizarIdioma(
    (user.user_metadata?.locale as string | undefined) ?? null,
  );
  const t = (texto: string) => traduzir(texto, idioma);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface/95 p-6 sm:p-8 shadow-xl backdrop-blur-xl transition-all">
      {/* Glow decorativo suave */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t("Verificação em duas etapas")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {t("Digite o código de 6 dígitos do seu autenticador.")}
            </p>
          </div>
        </div>

        <MfaForm next={next} />

        <div className="flex items-center justify-center gap-1.5 border-t border-border/50 pt-4 text-[11px] text-muted-foreground/80">
          <Lock className="h-3 w-3 text-emerald-500" />
          <span>{t("Ambiente seguro com autenticação RFC 6238")}</span>
        </div>
      </div>
    </div>
  );
}
