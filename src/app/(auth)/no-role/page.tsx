import { IdentificationBadgeIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser, homeFor } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("noRoleTitle") };
}

export default async function NoRolePage() {
  const current = await getCurrentUser();
  if (!current) redirect("/sign-in");
  if (current.roles.length > 0) redirect(homeFor(current));
  const t = await getTranslations("auth");
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-10">
      <h1 className="sr-only">{t("noRoleTitle")}</h1>
      <EmptyState icon={IdentificationBadgeIcon} title={t("noRoleTitle")} body={t("noRoleBody")} />
    </div>
  );
}
