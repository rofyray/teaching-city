import { createTranslator } from "next-intl";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

export const NOTIFICATION_TYPES = [
  "matchConfirmed",
  "ratingDue",
  "ratingPosted",
  "hoursReminder",
  "referenceRequest",
  "referenceConfirmed",
  "poolEntered",
  "invited",
  "vendorRequest",
  "invitePastTarget",
  "detailsRequest",
  "detailsConfirmed",
] as const;

export type KnownNotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isKnownType(type: string): type is KnownNotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(type);
}

/** Only same-site paths are followed from a notification, never full URLs. */
export function safeHref(href: unknown): string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") ? href : "/notifications";
}

/** Renders one notification with the "notifications" messages, payload values as ICU params. */
export function notificationText(locale: string, type: string, payload: Record<string, string | number>): string | null {
  if (!isKnownType(type)) return null;
  const t = createTranslator({ locale, messages: locale === "es" ? es : en, namespace: "notifications" });
  const params = Object.fromEntries(Object.entries(payload).filter(([k]) => k !== "href"));
  return (t as unknown as (key: string, values: Record<string, string | number>) => string)(type, params);
}
