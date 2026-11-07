import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { requireRole } from "@/server/session";

export default async function MentorLayout({ children }: { children: ReactNode }) {
  const current = await requireRole("preceptor", "sponsor");
  const t = await getTranslations();
  const items: NavItem[] = [{ href: "/m", label: t("nav.mentorHome"), icon: "students", exact: true }];
  if (current.roles.includes("sponsor")) items.push({ href: "/m/meetings", label: t("nav.meetings"), icon: "meetings" });
  items.push({ href: "/m/references", label: t("nav.references"), icon: "references" });
  return (
    <AppShell tabs line="finance" brand={t("common.appName")} actions={<HeaderActions current={current} />} items={items}>
      {children}
    </AppShell>
  );
}
