/**
 * Strings the vendor portal, notifications and email need that are not in the Content Pack yet.
 * Each entry is a TODO(copy) placeholder for review before launch.
 */
export const VENDOR_COPY = {
  // TODO(copy): empty state for /vendor/interviews
  interviewsEmptyTitle: { en: "No interview requests yet", es: "Todavía no hay solicitudes de entrevista" },
  // TODO(copy): empty state body for /vendor/interviews
  interviewsEmptyBody: {
    en: "Requests you send from the completers list show up here.",
    es: "Las solicitudes que envías desde la lista de egresados aparecen aquí.",
  },
  // TODO(copy): outcome select option before an outcome is recorded
  outcomeNone: { en: "Not recorded yet", es: "Aún sin registrar" },
  // TODO(copy): label before the date a request was sent
  requestedOn: { en: "Requested {date}", es: "Solicitada el {date}" },
  // TODO(copy): button on /notifications
  markAllRead: { en: "Mark all as read", es: "Marcar todo como leído" },
  // TODO(copy): screen reader label for unread notifications
  unread: { en: "Unread", es: "Sin leer" },
  // TODO(copy): unsubscribe line at the end of notification emails
  emailUnsubscribe: {
    en: "To stop these emails, open this link: {url}",
    es: "Para dejar de recibir estos correos, abre este enlace: {url}",
  },
  // TODO(copy): unsubscribe confirmation on /notifications?unsubscribe=1
  unsubscribeTitle: { en: "Stop notification emails?", es: "¿Dejar de recibir correos de avisos?" },
  // TODO(copy): unsubscribe confirm button
  unsubscribeConfirm: { en: "Stop emails", es: "Dejar de recibir correos" },
  // TODO(copy): unsubscribe done
  unsubscribeDone: {
    en: "You will no longer get notification emails. Notices still appear here.",
    es: "Ya no recibirás correos de avisos. Los avisos siguen apareciendo aquí.",
  },
} as const;

export type VendorCopyKey = keyof typeof VENDOR_COPY;

export function vendorCopy(locale: string, key: VendorCopyKey, params: Record<string, string> = {}): string {
  const entry = VENDOR_COPY[key];
  let text: string = locale === "es" ? entry.es : entry.en;
  for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
  return text;
}
