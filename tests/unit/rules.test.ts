import { describe, expect, it } from "vitest";
import {
  canEditRating,
  confirmedReferences,
  creditOnTrack,
  currentWeek,
  displayWeek,
  earningsCents,
  formatMoney,
  isPoolEligible,
  latestLevels,
  matchSuggestions,
  orderDueItems,
  overlapHours,
  poolEligibility,
  ratingDueState,
  shareLinkUsable,
  skillsAtBar,
  suppressSmallCounts,
  timeToOfferDays,
  validateHours,
  vendorVisible,
  visibleQuote,
  windowHours,
  type Level,
} from "@/domain/rules";
import { addDays, mondayOf, zonedTime } from "@/domain/time";

const TZ = "America/Chicago";
// Monday, September 28, 2026
const START = "2026-09-28";

describe("BR-1 current week", () => {
  it("is week 1 on the start Monday in the program time zone", () => {
    expect(currentWeek(START, zonedTime(START, "00:01", TZ), TZ)).toBe(1);
  });
  it("is still week 0 one minute before the start in Chicago even when UTC has rolled over", () => {
    expect(currentWeek(START, zonedTime("2026-09-27", "23:59", TZ), TZ)).toBe(0);
  });
  it("rolls to week 2 at midnight Chicago time on the second Monday", () => {
    expect(currentWeek(START, zonedTime("2026-10-04", "23:59", TZ), TZ)).toBe(1);
    expect(currentWeek(START, zonedTime("2026-10-05", "00:00", TZ), TZ)).toBe(2);
  });
  it("is week 6 on the Friday of the sixth week", () => {
    expect(currentWeek(START, zonedTime("2026-11-06", "12:00", TZ), TZ)).toBe(6);
  });
  it("clamps display week to the program length", () => {
    expect(displayWeek(START, zonedTime("2027-03-01", "12:00", TZ), TZ, 15)).toBe(15);
    expect(displayWeek(START, zonedTime("2026-09-01", "12:00", TZ), TZ, 15)).toBe(1);
  });
  it("finds the Monday of any date", () => {
    expect(mondayOf("2026-11-06")).toBe("2026-11-02");
    expect(mondayOf("2026-11-08")).toBe("2026-11-02");
    expect(mondayOf("2026-11-02")).toBe("2026-11-02");
    expect(addDays("2026-11-02", -35)).toBe(START);
  });
});

describe("BR-2 hours validation", () => {
  it("accepts 0 to 12 in half steps", () => {
    expect(validateHours("0")).toEqual({ ok: true, hours: 0 });
    expect(validateHours("10.5")).toEqual({ ok: true, hours: 10.5 });
    expect(validateHours("10,5")).toEqual({ ok: true, hours: 10.5 });
    expect(validateHours(12)).toEqual({ ok: true, hours: 12 });
  });
  it("rejects more than 12 and non-numbers", () => {
    expect(validateHours("12.5")).toEqual({ ok: false, error: "tooMany" });
    expect(validateHours("eleven")).toEqual({ ok: false, error: "notNumber" });
    expect(validateHours("")).toEqual({ ok: false, error: "notNumber" });
    expect(validateHours("-1")).toEqual({ ok: false, error: "notNumber" });
  });
});

describe("BR-3 earnings", () => {
  const at = new Date();
  it("counts submitted and approved hours", () => {
    const rows = [1, 2, 3, 4, 5, 6].map((week) => ({
      week,
      hours: 11,
      submittedAt: at,
      approvedAt: week < 6 ? at : null,
    }));
    expect(earningsCents(rows, 1700)).toBe(112_200);
    expect(formatMoney(112_200)).toBe("$1,122");
  });
  it("ignores unsubmitted entries and handles 0 hours", () => {
    expect(earningsCents([{ week: 1, hours: 0, submittedAt: at, approvedAt: null }], 1700)).toBe(0);
    expect(earningsCents([{ week: 1, hours: 5, submittedAt: null, approvedAt: null }], 1700)).toBe(0);
  });
  it("shows cents only when not whole", () => {
    expect(formatMoney(850)).toBe("$8.50");
  });
});

describe("BR-5 latest levels and skills at the bar", () => {
  const at = new Date();
  const ratings = [
    { week: 4, submittedAt: at, scores: [{ competencyId: "a", level: 3 }, { competencyId: "b", level: 2 }] },
    { week: 5, submittedAt: at, scores: [{ competencyId: "a", level: 4 }, { competencyId: "b", level: 2 }] },
    { week: 6, submittedAt: null, scores: [{ competencyId: "b", level: 4 }] },
  ];
  it("uses the latest submitted rating only", () => {
    const latest = latestLevels(ratings);
    expect(latest.get("a")).toBe(4);
    expect(latest.get("b")).toBe(2);
    expect(skillsAtBar(latest, ["a", "b", "c"])).toBe(1);
  });
  it("treats missing ratings as not at the bar", () => {
    expect(skillsAtBar(new Map(), ["a"])).toBe(0);
  });
});

describe("BR-6 rating due state", () => {
  it("is due through Friday and overdue from Saturday", () => {
    expect(ratingDueState(START, 6, zonedTime("2026-11-06", "23:59", TZ), TZ)).toBe("due");
    expect(ratingDueState(START, 6, zonedTime("2026-11-07", "00:00", TZ), TZ)).toBe("overdue");
    expect(ratingDueState(START, 5, zonedTime("2026-11-02", "09:00", TZ), TZ)).toBe("overdue");
    expect(ratingDueState(START, 7, zonedTime("2026-11-06", "09:00", TZ), TZ)).toBe("not_due");
  });
  it("allows edits until the next week is rated", () => {
    expect(canEditRating(5, [4, 5])).toBe(true);
    expect(canEditRating(5, [5, 6])).toBe(false);
  });
});

describe("BR-7 references and quotes", () => {
  const base = { quote: "Q", quoteApproved: true, quoteHiddenByStudent: false };
  it("counts only confirmed references", () => {
    expect(confirmedReferences([{ status: "confirmed" }, { status: "asked" }, { status: "declined" }])).toBe(1);
  });
  it("shows a quote only when confirmed, approved and not hidden", () => {
    expect(visibleQuote({ status: "confirmed", ...base })).toBe("Q");
    expect(visibleQuote({ status: "confirmed", ...base, quoteHiddenByStudent: true })).toBeNull();
    expect(visibleQuote({ status: "confirmed", ...base, quoteApproved: false })).toBeNull();
    expect(visibleQuote({ status: "asked", ...base })).toBeNull();
  });
});

describe("BR-8 pool eligibility", () => {
  const ids = ["1", "2", "3", "4", "5"];
  const allAtBar = new Map<string, Level>(ids.map((id) => [id, 3]));
  const base = {
    enrollmentStatus: "completed" as const,
    latest: allAtBar,
    competencyIds: ids,
    confirmedRefs: 3,
    referencesRequired: 3,
    shareCityHr: true,
  };
  it("is eligible with exactly 3 references and all skills at the bar", () => {
    expect(isPoolEligible(base)).toBe(true);
  });
  it("is not eligible before completion", () => {
    expect(poolEligibility({ ...base, enrollmentStatus: "active" }).missing.complete).toBe(true);
  });
  it("is not eligible with 2 references", () => {
    expect(poolEligibility({ ...base, confirmedRefs: 2 }).missing.refsShort).toBe(1);
  });
  it("is not eligible when consent is revoked", () => {
    expect(isPoolEligible({ ...base, shareCityHr: false })).toBe(false);
  });
  it("counts skills short", () => {
    const latest = new Map(allAtBar);
    latest.set("4", 2);
    expect(poolEligibility({ ...base, latest }).missing.skillsShort).toBe(1);
  });
});

describe("BR-9 time to offer", () => {
  it("counts calendar days in the program time zone", () => {
    expect(timeToOfferDays(zonedTime("2026-04-27", "09:00", TZ), zonedTime("2026-05-21", "15:00", TZ), TZ)).toBe(24);
  });
});

describe("BR-10 vendor visibility", () => {
  it("needs consent, an active pledge and completion", () => {
    expect(vendorVisible({ shareVendorBridge: true, pledgeActive: true, enrollmentStatus: "completed" })).toBe(true);
    expect(vendorVisible({ shareVendorBridge: false, pledgeActive: true, enrollmentStatus: "completed" })).toBe(false);
    expect(vendorVisible({ shareVendorBridge: true, pledgeActive: false, enrollmentStatus: "completed" })).toBe(false);
    expect(vendorVisible({ shareVendorBridge: true, pledgeActive: true, enrollmentStatus: "active" })).toBe(false);
  });
});

describe("BR-11 share links", () => {
  const now = new Date("2026-11-06T12:00:00Z");
  it("rejects revoked and expired links", () => {
    expect(shareLinkUsable({ expiresAt: new Date("2026-12-01"), revokedAt: null }, now)).toBe(true);
    expect(shareLinkUsable({ expiresAt: new Date("2026-11-01"), revokedAt: null }, now)).toBe(false);
    expect(shareLinkUsable({ expiresAt: new Date("2026-12-01"), revokedAt: now }, now)).toBe(false);
  });
});

describe("BR-12 matching suggestions", () => {
  const weekdays = [1, 2, 3, 4, 5].map((day) => ({ day, start: "08:00", end: "17:00" }));
  const amara = [
    { day: 1, start: "13:00", end: "17:00" },
    { day: 3, start: "13:00", end: "17:00" },
    { day: 5, start: "13:00", end: "17:00" },
    { day: 4, start: "17:00", end: "18:00" },
  ];
  const units = [
    { id: "it", name: "IT and GIS", majors: ["computer_science_it", "economics_data_math"], capacity: 5, filled: 0, scheduleWindows: weekdays },
    { id: "budget", name: "Budget Office", majors: ["accounting_finance", "economics_data_math", "business"], capacity: 6, filled: 5, scheduleWindows: weekdays },
    { id: "works", name: "Public Works", majors: ["engineering"], capacity: 6, filled: 0, scheduleWindows: weekdays },
  ];
  it("computes free and overlap hours", () => {
    expect(windowHours(amara)).toBe(13);
    expect(overlapHours(amara, weekdays)).toBe(12);
  });
  it("suggests Budget Office first for an accounting student", () => {
    const s = matchSuggestions({ majorCategory: "accounting_finance", availability: amara }, units);
    expect(s.map((u) => u.unitId)).toEqual(["budget"]);
    expect(s[0]).toMatchObject({ overlap: 12, free: 13 });
  });
  it("orders by overlap then name and skips full units", () => {
    const s = matchSuggestions({ majorCategory: "economics_data_math", availability: amara }, units);
    expect(s.map((u) => u.unitId)).toEqual(["budget", "it"]);
    const full = units.map((u) => (u.id === "budget" ? { ...u, filled: 6 } : u));
    expect(matchSuggestions({ majorCategory: "accounting_finance", availability: amara }, full)).toEqual([]);
  });
});

describe("BR-13 small counts", () => {
  it("suppresses groups under 5", () => {
    expect(suppressSmallCounts(4, 50)).toBe("fewer_than_5");
    expect(suppressSmallCounts(5, 50)).toBe(50);
  });
});

describe("P4.5 credit on track", () => {
  it("needs 10 hours per elapsed week", () => {
    expect(creditOnTrack(50, 5)).toBe(true);
    expect(creditOnTrack(49.5, 5)).toBe(false);
  });
});

describe("P5.2 next item due", () => {
  it("orders overdue first, then rating, hours, meeting, reference", () => {
    const ordered = orderDueItems([
      { kind: "reference", state: "due" },
      { kind: "meeting", state: "due" },
      { kind: "hours", state: "due" },
      { kind: "rating", state: "due" },
    ]);
    expect(ordered.map((i) => i.kind)).toEqual(["rating", "hours", "meeting", "reference"]);
    const withOverdue = orderDueItems([
      { kind: "rating", state: "due" },
      { kind: "hours", state: "overdue" },
      { kind: "meeting", state: "not_due" },
    ]);
    expect(withOverdue.map((i) => i.kind)).toEqual(["hours", "rating"]);
  });
});
