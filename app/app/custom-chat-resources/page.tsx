import { redirect } from "next/navigation";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { traduzir } from "@/lib/i18n/dicionario";
import { CustomChatResourcesClient } from "./_components/CustomChatResourcesClient";

export const dynamic = "force-dynamic";

export default async function CustomChatResourcesPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);
  if (!activeOrg) redirect("/app/inbox");
  const idioma = user.idioma;
  const t = (texto: string) => traduzir(texto, idioma);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("Custom chat resourses")}</h1>
      </header>
      <CustomChatResourcesClient />
    </div>
  );
}
