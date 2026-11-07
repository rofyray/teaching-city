import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { requireRole } from "@/server/session";

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const current = await requireRole("vendor_recruiter");
  const t = await getTranslations();
  return (
    <AppShell
      brand={t("common.appName")}
      actions={<HeaderActions current={current} />}
      items={[
        { href: "/vendor", label: t("nav.vendorStudents"), icon: "students", exact: true },
        { href: "/vendor/interviews", label: t("nav.vendorInterviews"), icon: "meetings" },
      ]}
    >
      {children}
    </AppShell>
  );
}
