/** Calendar helpers that work on ISO dates ("YYYY-MM-DD") in a program's time zone. */

const DAY_MS = 86_400_000;

export function localDate(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function toUtcMs(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(isoDate: string, days: number): string {
  return new Date(toUtcMs(isoDate) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtcMs(toIso) - toUtcMs(fromIso)) / DAY_MS);
}

/** ISO weekday, 1 = Monday through 7 = Sunday. */
export function weekday(isoDate: string): number {
  const day = new Date(toUtcMs(isoDate)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function mondayOf(isoDate: string): string {
  return addDays(isoDate, 1 - weekday(isoDate));
}

/** Offset in minutes between UTC and the zone at the given instant (zone minus UTC). */
function zoneOffsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** The instant that is the given wall-clock time on an ISO date in a time zone. */
export function zonedTime(isoDate: string, time: string, timeZone: string): Date {
  const [h, m] = time.split(":").map(Number);
  const guess = new Date(toUtcMs(isoDate) + (h * 60 + m) * 60_000);
  const offset = zoneOffsetMinutes(guess, timeZone);
  const first = new Date(guess.getTime() - offset * 60_000);
  const corrected = zoneOffsetMinutes(first, timeZone);
  return corrected === offset ? first : new Date(guess.getTime() - corrected * 60_000);
}
