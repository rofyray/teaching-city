import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { getCurrentUser } from "@/server/session";

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "NEXT_LOCALE";

export default getRequestConfig(async () => {
  const current = await getCurrentUser().catch(() => null);
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = current?.locale ?? (cookieLocale === "es" ? "es" : "en");
  return {
    locale,
    timeZone: "America/Chicago",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
