import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { pledgeActive, vendorVisible } from "@/domain/rules";
import { db } from "./db";
import { consents, enrollments, references, studentProfiles, vendorInterest, vendorPledges } from "./db/schema";
import { decide, type Action, type Actor, type DataKind, type StudentContext } from "./permissions";
import type { CurrentUser } from "./session";

export { canReadAggregates } from "./permissions";

export class ForbiddenError extends Error {
  constructor(message = "Not allowed") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function actorFrom(current: CurrentUser): Actor {
  return {
    userId: current.id,
    roles: current.roles,
    collegeOrgIds: current.memberships.filter((m) => m.role === "college_coordinator").map((m) => m.organizationId),
    vendorOrgIds: current.memberships.filter((m) => m.role === "vendor_recruiter").map((m) => m.organizationId),
  };
}

/** Latest consent state per type for a student (the latest row per type wins). */
export async function consentState(studentId: string) {
  const rows = await db
    .select()
    .from(consents)
    .where(eq(consents.studentId, studentId))
    .orderBy(desc(consents.createdAt));
  const state: Record<string, boolean> = {};
  for (const row of rows) if (!(row.type in state)) state[row.type] = row.granted;
  return {
    program_participation: state.program_participation ?? false,
    share_city_hr: state.share_city_hr ?? false,
    share_vendor_bridge: state.share_vendor_bridge ?? false,
    public_link: state.public_link ?? false,
    demographic_reporting: state.demographic_reporting ?? false,
  };
}

/** Is there an active pledge for any of these vendor orgs right now? */
export async function activePledgeFor(vendorOrgIds: string[], now = new Date()): Promise<boolean> {
  if (vendorOrgIds.length === 0) return false;
  const rows = await db.select().from(vendorPledges).where(inArray(vendorPledges.vendorOrgId, vendorOrgIds));
  return rows.some((p) => pledgeActive(p, now));
}

export async function loadStudentContext(studentId: string, actor: Actor): Promise<StudentContext | null> {
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, studentId)).limit(1);
  if (!profile) return null;
  const enrolls = await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  const consent = await consentState(studentId);
  const refRows = enrolls.length
    ? await db
        .select({ refereeUserId: references.refereeUserId })
        .from(references)
        .where(inArray(references.enrollmentId, enrolls.map((e) => e.id)))
    : [];
  const interestRows = await db
    .select({ vendorOrgId: vendorInterest.vendorOrgId })
    .from(vendorInterest)
    .where(eq(vendorInterest.studentId, studentId));
  const pledge = await activePledgeFor(actor.vendorOrgIds);
  const completed = enrolls.some((e) => e.status === "completed");
  return {
    studentUserId: profile.userId,
    collegeOrgId: profile.collegeOrgId,
    preceptorIds: enrolls.map((e) => e.preceptorId).filter((x): x is string => !!x),
    sponsorIds: enrolls.map((e) => e.sponsorId).filter((x): x is string => !!x),
    shareCityHr: consent.share_city_hr,
    vendorVisible: vendorVisible({
      shareVendorBridge: consent.share_vendor_bridge,
      pledgeActive: pledge,
      enrollmentStatus: completed ? "completed" : "active",
    }),
    refereeUserIds: refRows.map((r) => r.refereeUserId).filter((x): x is string => !!x),
    interestVendorOrgIds: interestRows.map((r) => r.vendorOrgId),
  };
}

export async function can(current: CurrentUser, kind: DataKind, action: Action, studentId: string): Promise<boolean> {
  const actor = actorFrom(current);
  const ctx = await loadStudentContext(studentId, actor);
  return !!ctx && decide(actor, kind, action, ctx);
}

export async function assertCan(current: CurrentUser, kind: DataKind, action: Action, studentId: string) {
  if (!(await can(current, kind, action, studentId))) throw new ForbiddenError();
}

export async function studentIdForEnrollment(enrollmentId: string): Promise<string | null> {
  const [row] = await db
    .select({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  return row?.studentId ?? null;
}

export async function assertCanEnrollment(current: CurrentUser, kind: DataKind, action: Action, enrollmentId: string) {
  const studentId = await studentIdForEnrollment(enrollmentId);
  if (!studentId) throw new ForbiddenError();
  await assertCan(current, kind, action, studentId);
  return studentId;
}

export function assertRole(current: CurrentUser, ...roles: CurrentUser["roles"]) {
  if (!roles.some((r) => current.roles.includes(r))) throw new ForbiddenError();
}

export async function isReferee(current: CurrentUser, referenceId: string) {
  const [row] = await db
    .select({ id: references.id })
    .from(references)
    .where(and(eq(references.id, referenceId), eq(references.refereeUserId, current.id)))
    .limit(1);
  return !!row;
}
