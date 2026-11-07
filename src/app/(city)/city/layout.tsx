import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { requireRole } from "@/server/session";

export default async function CityLayout({ children }: { children: ReactNode }) {
  const current = await requireRole("city_coordinator");
  const t = await getTranslations("nav");
  return (
    <AppShell
      line="community"
      brand={(await getTranslations("common"))("appName")}
      actions={<HeaderActions current={current} />}
      items={[
        { href: "/city", label: t("cityOverview"), icon: "overview", exact: true },
        { href: "/city/units", label: t("units"), icon: "units" },
        { href: "/city/matching", label: t("matching"), icon: "matching" },
        { href: "/city/classifications", label: t("classifications"), icon: "classifications" },
        { href: "/city/pool", label: t("pool"), icon: "pool" },
        { href: "/city/openings", label: t("openingsAdmin"), icon: "openings" },
        { href: "/city/vendors", label: t("vendors"), icon: "vendors" },
        { href: "/city/outcomes", label: t("outcomes"), icon: "outcomes" },
        { href: "/city/pilot", label: t("pilotBudget"), icon: "budget" },
      ]}
    >
      {children}
    </AppShell>
  );
}
