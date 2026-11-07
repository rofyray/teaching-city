import { describe, expect, it } from "vitest";
import { canReadAggregates, decide, type Actor, type DataKind, type StudentContext } from "@/server/permissions";

const ctx: StudentContext = {
  studentUserId: "amara",
  collegeOrgId: "wsu",
  preceptorIds: ["dana"],
  sponsorIds: ["marcus"],
  shareCityHr: true,
  vendorVisible: false,
  refereeUserIds: ["dana", "marcus"],
  interestVendorOrgIds: [],
};

const actor = (userId: string, roles: Actor["roles"], extra: Partial<Actor> = {}): Actor => ({
  userId,
  roles,
  collegeOrgIds: [],
  vendorOrgIds: [],
  ...extra,
});

const amara = actor("amara", ["student"]);
const jordan = actor("jordan", ["student"]);
const dana = actor("dana", ["preceptor"]);
const kevin = actor("kevin", ["preceptor"]);
const marcus = actor("marcus", ["sponsor"]);
const renee = actor("renee", ["city_coordinator"]);
const omar = actor("omar", ["college_coordinator"], { collegeOrgIds: ["wsu"] });
const alicia = actor("alicia", ["college_coordinator"], { collegeOrgIds: ["wcc"] });
const kim = actor("kim", ["vendor_recruiter"], { vendorOrgIds: ["brightline"] });

const can = (a: Actor, kind: DataKind, action: "read" | "write", c: StudentContext = ctx) => decide(a, kind, action, c);

describe("permission matrix (Section 2.1)", () => {
  it("student profile: own R/W, assigned mentors read, consented city, own college, consented vendor", () => {
    expect(can(amara, "profile", "write")).toBe(true);
    expect(can(jordan, "profile", "read")).toBe(false);
    expect(can(dana, "profile", "read")).toBe(true);
    expect(can(dana, "profile", "write")).toBe(false);
    expect(can(kevin, "profile", "read")).toBe(false);
    expect(can(marcus, "profile", "read")).toBe(true);
    expect(can(renee, "profile", "read")).toBe(true);
    expect(can(renee, "profile", "read", { ...ctx, shareCityHr: false })).toBe(false);
    expect(can(omar, "profile", "read")).toBe(true);
    expect(can(alicia, "profile", "read")).toBe(false);
    expect(can(kim, "profile", "read")).toBe(false);
    expect(can(kim, "profile", "read", { ...ctx, vendorVisible: true })).toBe(true);
  });

  it("demographics: only the student; coordinators get aggregates", () => {
    expect(can(amara, "demographics", "write")).toBe(true);
    for (const a of [dana, marcus, renee, omar, kim]) expect(can(a, "demographics", "read")).toBe(false);
    expect(canReadAggregates(renee)).toBe(true);
    expect(canReadAggregates(omar, "wsu")).toBe(true);
    expect(canReadAggregates(omar, "wcc")).toBe(false);
    expect(canReadAggregates(dana)).toBe(false);
  });

  it("hours: own R/W, preceptor approves, sponsor reads, vendor never", () => {
    expect(can(amara, "hours", "write")).toBe(true);
    expect(can(dana, "hours", "write")).toBe(true);
    expect(can(marcus, "hours", "read")).toBe(true);
    expect(can(marcus, "hours", "write")).toBe(false);
    expect(can(renee, "hours", "read")).toBe(true);
    expect(can(renee, "hours", "write")).toBe(false);
    expect(can(kim, "hours", "read", { ...ctx, vendorVisible: true })).toBe(false);
  });

  it("weekly ratings and notes: student reads own, preceptor writes, vendor never", () => {
    expect(can(amara, "ratings", "read")).toBe(true);
    expect(can(amara, "ratings", "write")).toBe(false);
    expect(can(dana, "ratings", "write")).toBe(true);
    expect(can(kevin, "ratings", "write")).toBe(false);
    expect(can(marcus, "ratings", "read")).toBe(true);
    expect(can(omar, "ratings", "read")).toBe(true);
    expect(can(alicia, "ratings", "read")).toBe(false);
    expect(can(kim, "ratings", "read", { ...ctx, vendorVisible: true })).toBe(false);
  });

  it("evidence sentences: preceptor writes, consented vendor reads", () => {
    expect(can(dana, "evidence", "write")).toBe(true);
    expect(can(amara, "evidence", "write")).toBe(false);
    expect(can(kim, "evidence", "read", { ...ctx, vendorVisible: true })).toBe(true);
    expect(can(kim, "evidence", "read")).toBe(false);
  });

  it("work samples: student writes own, preceptor verifies, sponsor reads", () => {
    expect(can(amara, "samples", "write")).toBe(true);
    expect(can(dana, "samples", "write")).toBe(true);
    expect(can(marcus, "samples", "write")).toBe(false);
    expect(can(renee, "samples", "read", { ...ctx, shareCityHr: false })).toBe(false);
    expect(can(kim, "samples", "read", { ...ctx, vendorVisible: true })).toBe(true);
  });

  it("references: referees write their own reference only", () => {
    expect(can(amara, "references", "read")).toBe(true);
    expect(can(dana, "references", "write")).toBe(true);
    expect(can(marcus, "references", "write")).toBe(true);
    expect(can(kevin, "references", "write")).toBe(false);
    expect(can(renee, "references", "read")).toBe(true);
    expect(can(kim, "references", "read")).toBe(false);
  });

  it("pool entries, openings, invites: city writes, student and college read", () => {
    expect(can(renee, "pool", "write")).toBe(true);
    expect(can(amara, "pool", "read")).toBe(true);
    expect(can(amara, "pool", "write")).toBe(false);
    expect(can(omar, "pool", "read")).toBe(true);
    expect(can(dana, "pool", "read")).toBe(false);
    expect(can(kim, "pool", "read")).toBe(false);
  });

  it("vendor interest: own firm writes, student answers, city reads, college none", () => {
    expect(can(kim, "vendorInterest", "write", { ...ctx, vendorVisible: true })).toBe(true);
    expect(can(kim, "vendorInterest", "write")).toBe(false);
    expect(can(kim, "vendorInterest", "read", { ...ctx, interestVendorOrgIds: ["brightline"] })).toBe(true);
    expect(can(amara, "vendorInterest", "read")).toBe(true);
    expect(can(renee, "vendorInterest", "read")).toBe(true);
    expect(can(renee, "vendorInterest", "write")).toBe(false);
    expect(can(omar, "vendorInterest", "read")).toBe(false);
  });

  it("outcomes: city and own college only", () => {
    expect(can(renee, "outcomes", "read")).toBe(true);
    expect(can(omar, "outcomes", "read")).toBe(true);
    expect(can(amara, "outcomes", "read")).toBe(false);
    expect(can(dana, "outcomes", "read")).toBe(false);
    expect(can(kim, "outcomes", "read")).toBe(false);
  });
});
