import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { getStudentArea } from "@/server/queries/student";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const { current, view } = await getStudentArea();
  const t = await getTranslations();
  return (
    <AppShell
      tabs
      line={view?.unit?.lineColor}
      brand={t("common.appName")}
      actions={<HeaderActions current={current} settingsHref="/s/settings" />}
      items={[
        { href: "/s", label: t("nav.route"), icon: "route", exact: true },
        { href: "/s/transcript", label: t("nav.transcript"), icon: "transcript" },
        { href: "/s/people", label: t("nav.people"), icon: "people" },
        { href: "/s/openings", label: t("nav.openings"), icon: "openings" },
      ]}
    >
      {children}
    </AppShell>
  );
}
