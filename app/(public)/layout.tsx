import { marcaDaSaida } from "@/lib/branding/saida";
import { createClient } from "@/lib/supabase/server";
import { IdiomaProvider } from "@/lib/i18n/IdiomaProvider";

/**
 * A casca das telas de acesso — login, cadastro, recuperação, MFA.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const marca = await marcaDaSaida(null);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = (user?.user_metadata?.locale as string | undefined) ?? null;

  return (
    <IdiomaProvider locale={locale}>
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {marca.logoUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-testid="logo-da-fachada"
                src={marca.logoUrl}
                alt={marca.nome}
                className="h-10 w-auto max-w-[12rem] object-contain"
              />
            </div>
          )}
          {children}
        </div>
      </div>
    </IdiomaProvider>
  );
}
