/**
 * The permission matrix from PRD Section 2.1 as a pure function, so it can be unit tested
 * without a database. `src/server/authz.ts` loads the context and calls `decide`.
 */
import type { Role } from "./db/schema";

export type DataKind =
  | "profile"
  | "demographics"
  | "hours"
  | "ratings"
  | "evidence"
  | "samples"
  | "references"
  | "pool"
  | "vendorInterest"
  | "outcomes";

export type Action = "read" | "write";

export type Actor = {
  userId: string;
  roles: Role[];
  collegeOrgIds: string[];
  vendorOrgIds: string[];
};

export type StudentContext = {
  studentUserId: string;
  collegeOrgId: string | null;
  preceptorIds: string[];
  sponsorIds: string[];
  shareCityHr: boolean;
  /** BR-10 already evaluated for the actor's vendor organization. */
  vendorVisible: boolean;
  /** Referee user ids on the record, for "own reference" writes. */
  refereeUserIds?: string[];
  /** Vendor organizations that hold interest rows for this student. */
  interestVendorOrgIds?: string[];
};

export function decide(actor: Actor, kind: DataKind, action: Action, ctx: StudentContext): boolean {
  const has = (r: Role) => actor.roles.includes(r);
  const own = ctx.studentUserId === actor.userId;
  const preceptorAssigned = has("preceptor") && ctx.preceptorIds.includes(actor.userId);
  const sponsorAssigned = has("sponsor") && ctx.sponsorIds.includes(actor.userId);
  const city = has("city_coordinator");
  const cityConsented = city && ctx.shareCityHr;
  const college = has("college_coordinator") && !!ctx.collegeOrgId && actor.collegeOrgIds.includes(ctx.collegeOrgId);
  const vendor = has("vendor_recruiter") && ctx.vendorVisible;
  const ownReference = (ctx.refereeUserIds ?? []).includes(actor.userId);

  const read = action === "read";

  switch (kind) {
    case "profile":
      if (own && has("student")) return true;
      return read && (preceptorAssigned || sponsorAssigned || cityConsented || college || vendor);
    case "demographics":
      // Coordinators see aggregates only, through `canReadAggregates`.
      return own && has("student");
    case "hours":
      if (own && has("student")) return true;
      if (preceptorAssigned) return true;
      return read && (sponsorAssigned || cityConsented || college);
    case "ratings":
      if (preceptorAssigned) return true;
      return read && ((own && has("student")) || sponsorAssigned || cityConsented || college);
    case "evidence":
      if (preceptorAssigned) return true;
      return read && ((own && has("student")) || sponsorAssigned || cityConsented || college || vendor);
    case "samples":
      if (own && has("student")) return true;
      if (preceptorAssigned) return true;
      return read && (sponsorAssigned || cityConsented || college || vendor);
    case "references":
      if (!read) return (has("preceptor") || has("sponsor") || city) && ownReference;
      return (own && has("student")) || preceptorAssigned || sponsorAssigned || ownReference || cityConsented || college || vendor;
    case "pool":
      if (city) return true;
      return read && ((own && has("student")) || college);
    case "vendorInterest": {
      const ownFirm = (ctx.interestVendorOrgIds ?? []).some((id) => actor.vendorOrgIds.includes(id));
      if (has("vendor_recruiter") && (vendor || ownFirm)) return true;
      // Students answer requests made to them; that is their only write.
      if (own && has("student")) return true;
      return read && city;
    }
    case "outcomes":
      return read && (city || college);
  }
}

/** Aggregate demographic and outcome reads (n of 5 or more is enforced where counts render). */
export function canReadAggregates(actor: Actor, collegeOrgId?: string): boolean {
  if (actor.roles.includes("city_coordinator")) return true;
  if (actor.roles.includes("college_coordinator")) {
    return collegeOrgId === undefined || actor.collegeOrgIds.includes(collegeOrgId);
  }
  return false;
}
