const TZ = "America/Chicago";

export function formatDate(date: Date | null | undefined, locale: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatDateTime(date: Date | null | undefined, locale: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** ISO date ("YYYY-MM-DD") of an instant in the program time zone, for date inputs. */
export function isoDate(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function formatDollars(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}
