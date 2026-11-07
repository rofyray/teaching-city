import type { ScheduleWindow } from "@/server/db/schema";
import { addDays, daysBetween, localDate } from "./time";

export type Level = 1 | 2 | 3 | 4;
export const LEVELS: Level[] = [1, 2, 3, 4];
export const BAR_LEVEL = 3;
export const COMPETENCY_COUNT = 5;

// BR-1

/** Week number (1-based) of today for a rotation that starts on startDate. 0 before the start. */
export function currentWeek(startDate: string, now: Date, timeZone: string): number {
  const days = daysBetween(startDate, localDate(now, timeZone));
  if (days < 0) return 0;
  return Math.floor(days / 7) + 1;
}

/** Current week clamped to the program length, for display ("Week 6 of 15"). */
export function displayWeek(startDate: string, now: Date, timeZone: string, weeks: number): number {
  return Math.min(Math.max(currentWeek(startDate, now, timeZone), 1), weeks);
}

export function weekStart(startDate: string, week: number): string {
  return addDays(startDate, (week - 1) * 7);
}

// BR-2

export type HoursValidation = { ok: true; hours: number } | { ok: false; error: "notNumber" | "tooMany" };

export function validateHours(input: string | number, maxHours = 12): HoursValidation {
  // Accept a decimal comma too ("10,5"), as Spanish speakers write it.
  const raw = typeof input === "number" ? String(input) : input.trim().replace(",", ".");
  if (raw === "" || !/^\d+(\.\d+)?$/.test(raw)) return { ok: false, error: "notNumber" };
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 0) return { ok: false, error: "notNumber" };
  if (hours > maxHours) return { ok: false, error: "tooMany" };
  return { ok: true, hours };
}

// BR-3

export type HoursRow = { week: number; hours: number; submittedAt: Date | null; approvedAt: Date | null };

export function countedHours(rows: HoursRow[]): number {
  return rows.filter((r) => r.submittedAt || r.approvedAt).reduce((sum, r) => sum + Number(r.hours), 0);
}

export function earningsCents(rows: HoursRow[], payRateCents: number): number {
  return Math.round(countedHours(rows) * payRateCents);
}

export function formatMoney(cents: number, locale = "en-US"): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, "");
}

// BR-4 and BR-5

export type RatingRow = {
  week: number;
  submittedAt: Date | null;
  scores: { competencyId: string; level: number }[];
};

/** Latest submitted level per competency id. */
export function latestLevels(ratings: RatingRow[]): Map<string, Level> {
  const latest = new Map<string, { week: number; level: Level }>();
  for (const rating of ratings) {
    if (!rating.submittedAt) continue;
    for (const score of rating.scores) {
      const prev = latest.get(score.competencyId);
      if (!prev || rating.week > prev.week) {
        latest.set(score.competencyId, { week: rating.week, level: score.level as Level });
      }
    }
  }
  return new Map([...latest].map(([id, v]) => [id, v.level]));
}

export function isAtBar(level: number | undefined): boolean {
  return level !== undefined && level >= BAR_LEVEL;
}

export function skillsAtBar(latest: Map<string, Level>, competencyIds: string[]): number {
  return competencyIds.filter((id) => isAtBar(latest.get(id))).length;
}

// BR-6

export type DueState = "due" | "overdue" | "not_due";

/** Due state of the rating for `week`: due until the end of that week's Friday, overdue after. */
export function ratingDueState(startDate: string, week: number, now: Date, timeZone: string): DueState {
  const friday = addDays(weekStart(startDate, week), 4);
  const today = localDate(now, timeZone);
  if (today < weekStart(startDate, week)) return "not_due";
  return today > friday ? "overdue" : "due";
}

/** A rating can be edited until the next week's rating is submitted. */
export function canEditRating(week: number, submittedWeeks: number[]): boolean {
  return !submittedWeeks.some((w) => w > week);
}

// BR-7

export type ReferenceRow = {
  status: "asked" | "confirmed" | "declined";
  quote: string | null;
  quoteApproved: boolean;
  quoteHiddenByStudent: boolean;
};

export function confirmedReferences(refs: Pick<ReferenceRow, "status">[]): number {
  return refs.filter((r) => r.status === "confirmed").length;
}

export function visibleQuote(ref: ReferenceRow): string | null {
  if (ref.status !== "confirmed" || !ref.quote || !ref.quoteApproved || ref.quoteHiddenByStudent) return null;
  return ref.quote;
}

// BR-8

export type EligibilityInput = {
  enrollmentStatus: "proposed" | "active" | "completed" | "withdrawn";
  latest: Map<string, Level>;
  competencyIds: string[];
  confirmedRefs: number;
  referencesRequired: number;
  shareCityHr: boolean;
};

export type Eligibility = {
  eligible: boolean;
  missing: { complete: boolean; skillsShort: number; refsShort: number; consent: boolean };
};

export function poolEligibility(input: EligibilityInput): Eligibility {
  const atBar = skillsAtBar(input.latest, input.competencyIds);
  const missing = {
    complete: input.enrollmentStatus !== "completed",
    skillsShort: Math.max(0, input.competencyIds.length - atBar),
    refsShort: Math.max(0, input.referencesRequired - input.confirmedRefs),
    consent: !input.shareCityHr,
  };
  const eligible =
    !missing.complete &&
    input.competencyIds.length > 0 &&
    missing.skillsShort === 0 &&
    missing.refsShort === 0 &&
    !missing.consent;
  return { eligible, missing };
}

export function isPoolEligible(input: EligibilityInput): boolean {
  return poolEligibility(input).eligible;
}

// BR-9

export function timeToOfferDays(enteredAt: Date, offerAt: Date, timeZone: string): number {
  return daysBetween(localDate(enteredAt, timeZone), localDate(offerAt, timeZone));
}

// BR-10

export function vendorVisible(input: {
  shareVendorBridge: boolean;
  pledgeActive: boolean;
  enrollmentStatus: string;
}): boolean {
  return input.shareVendorBridge && input.pledgeActive && input.enrollmentStatus === "completed";
}

export function pledgeActive(pledge: { endedAt: Date | null; pledgedAt: Date }, now: Date): boolean {
  return pledge.pledgedAt <= now && (!pledge.endedAt || pledge.endedAt > now);
}

// BR-11

export const SHARE_LINK_DAYS = 90;
export const DEMO_SHARE_LINK_HOURS = 24;

export function shareLinkUsable(link: { expiresAt: Date; revokedAt: Date | null }, now: Date): boolean {
  return !link.revokedAt && link.expiresAt > now;
}

// BR-12

function minutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function windowHours(windows: ScheduleWindow[]): number {
  return windows.reduce((sum, w) => sum + Math.max(0, minutes(w.end) - minutes(w.start)) / 60, 0);
}

export function overlapHours(a: ScheduleWindow[], b: ScheduleWindow[]): number {
  let total = 0;
  for (const x of a) {
    for (const y of b) {
      if (x.day !== y.day) continue;
      const start = Math.max(minutes(x.start), minutes(y.start));
      const end = Math.min(minutes(x.end), minutes(y.end));
      if (end > start) total += (end - start) / 60;
    }
  }
  return total;
}

export type UnitForMatch = {
  id: string;
  name: string;
  majors: string[];
  capacity: number;
  filled: number;
  scheduleWindows: ScheduleWindow[];
};

export type MatchSuggestion = { unitId: string; unitName: string; overlap: number; free: number };

/** Units that accept the major and have room, by schedule overlap then name. Never excludes manual choices. */
export function matchSuggestions(
  student: { majorCategory: string | null; availability: ScheduleWindow[] },
  units: UnitForMatch[],
): MatchSuggestion[] {
  const free = windowHours(student.availability);
  return units
    .filter((u) => student.majorCategory && u.majors.includes(student.majorCategory) && u.filled < u.capacity)
    .map((u) => ({ unitId: u.id, unitName: u.name, overlap: overlapHours(student.availability, u.scheduleWindows), free }))
    .sort((a, b) => b.overlap - a.overlap || a.unitName.localeCompare(b.unitName));
}

// BR-13

export const MIN_GROUP = 5;

export function suppressSmallCounts<T>(n: number, value: T): T | "fewer_than_5" {
  return n < MIN_GROUP ? "fewer_than_5" : value;
}

// P4.5

export function creditOnTrack(hoursToDate: number, weeksElapsed: number, minHours = 10): boolean {
  return hoursToDate >= minHours * weeksElapsed;
}

// P5.2

export type DueItem =
  | { kind: "rating"; state: DueState }
  | { kind: "hours"; state: DueState }
  | { kind: "meeting"; state: DueState }
  | { kind: "reference"; state: DueState };

const DUE_PRIORITY: DueItem["kind"][] = ["rating", "hours", "meeting", "reference"];

/** Most urgent item first: overdue before due, then rating, hours, meeting, reference. */
export function orderDueItems(items: DueItem[]): DueItem[] {
  const rank = (s: DueState) => (s === "overdue" ? 0 : s === "due" ? 1 : 2);
  return [...items]
    .filter((i) => i.state !== "not_due")
    .sort((a, b) => rank(a.state) - rank(b.state) || DUE_PRIORITY.indexOf(a.kind) - DUE_PRIORITY.indexOf(b.kind));
}
