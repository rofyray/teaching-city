import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Overpass } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "@/components/toast";
import { isDemoMode } from "@/server/auth";
import "./globals.css";

const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: { default: t("appName"), template: `%s | ${t("appName")}` },
    description: t("tagline"),
    applicationName: t("appName"),
  };
}

export const viewport: Viewport = {
  themeColor: "#111A1F",
};

/** Namespaces read by Client Components; server-only copy stays out of the page payload. */
const CLIENT_NAMESPACES = [
  "ai", "auth", "banner", "city", "common", "demo", "errors", "hours", "levels", "majorCategories", "matching",
  "meetings", "mentor", "nav", "note", "onboarding", "openings", "openingsAdmin", "people", "pilot", "pool",
  "rating", "references", "roles", "sharing", "vendorPortal", "vendors", "work",
] as const;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const all = await getMessages();
  const messages = Object.fromEntries(CLIENT_NAMESPACES.filter((ns) => ns in all).map((ns) => [ns, all[ns]]));
  return (
    <html lang={locale} className={`${overpass.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster
            initial={isDemoMode() ? [{ id: "sample-data", message: (all.banner as { sample: string }).sample, variant: "info", duration: null }] : []}
          />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
