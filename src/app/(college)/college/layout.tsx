import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { requireRole } from "@/server/session";

export default async function CollegeLayout({ children }: { children: ReactNode }) {
  const current = await requireRole("college_coordinator");
  const t = await getTranslations();
  return (
    <AppShell
      line="tech"
      brand={t("common.appName")}
      actions={<HeaderActions current={current} />}
      items={[
        { href: "/college", label: t("nav.cohort"), icon: "college", exact: true },
        { href: "/college/outcomes", label: t("nav.outcomes"), icon: "outcomes" },
      ]}
    >
      {children}
    </AppShell>
  );
}
