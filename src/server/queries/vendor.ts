import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { pledgeActive, vendorVisible } from "@/domain/rules";
import { db } from "../db";
import {
  consents,
  enrollments,
  jobClassifications,
  organizations,
  studentProfiles,
  user,
  vendorInterest,
  vendorPledges,
} from "../db/schema";
import { getEnrollmentView } from "./enrollment";
import type { CurrentUser } from "../session";

export type FirmContext = { orgId: string; name: string; pledgeActive: boolean };

export type VisibilityCandidate = { studentId: string; enrollmentStatus: string; shareVendorBridge: boolean };

/** BR-10 over a list of candidates: which students a firm may see. Pure, for tests. */
export function visibleStudentIds(candidates: VisibilityCandidate[], firmPledgeActive: boolean): string[] {
  const seen = new Set<string>();
  for (const c of candidates) {
    if (vendorVisible({ shareVendorBridge: c.shareVendorBridge, pledgeActive: firmPledgeActive, enrollmentStatus: c.enrollmentStatus })) {
      seen.add(c.studentId);
    }
  }
  return [...seen];
}

/** The recruiter's firm and whether its pledge is active right now. */
export async function getFirm(current: CurrentUser, now = new Date()): Promise<FirmContext | null> {
  const membership = current.memberships.find((m) => m.role === "vendor_recruiter");
  if (!membership) return null;
  const pledges = await db.select().from(vendorPledges).where(eq(vendorPledges.vendorOrgId, membership.organizationId));
  return {
    orgId: membership.organizationId,
    name: membership.organizationName,
    pledgeActive: pledges.some((p) => pledgeActive(p, now)),
  };
}

/** Latest share_vendor_bridge consent per student (the latest row per type wins). */
async function vendorConsentByStudent(studentIds: string[]) {
  const state = new Map<string, boolean>();
  if (studentIds.length === 0) return state;
  const rows = await db
    .select({ studentId: consents.studentId, granted: consents.granted })
    .from(consents)
    .where(and(inArray(consents.studentId, studentIds), eq(consents.type, "share_vendor_bridge")))
    .orderBy(desc(consents.createdAt));
  for (const row of rows) if (!state.has(row.studentId)) state.set(row.studentId, row.granted);
  return state;
}

async function completedCandidates(studentIds?: string[]): Promise<VisibilityCandidate[]> {
  const rows = await db
    .select({ studentId: enrollments.studentId, status: enrollments.status })
    .from(enrollments)
    .where(
      studentIds
        ? and(eq(enrollments.status, "completed"), inArray(enrollments.studentId, studentIds))
        : eq(enrollments.status, "completed"),
    );
  const consent = await vendorConsentByStudent([...new Set(rows.map((r) => r.studentId))]);
  return rows.map((r) => ({ studentId: r.studentId, enrollmentStatus: r.status, shareVendorBridge: consent.get(r.studentId) ?? false }));
}

/** BR-10 for one student and one firm. */
export async function isVisibleToFirm(studentId: string, firm: FirmContext): Promise<boolean> {
  if (!firm.pledgeActive) return false;
  return visibleStudentIds(await completedCandidates([studentId]), true).includes(studentId);
}

export type CompleterCard = {
  studentId: string;
  name: string;
  school: string;
  major: string;
  classification: string;
  atBar: number;
  pendingRequest: boolean;
};

/** Completers the firm may see, with only the BR-10 fields. */
export async function listVisibleCompleters(firm: FirmContext): Promise<CompleterCard[]> {
  if (!firm.pledgeActive) return [];
  const ids = visibleStudentIds(await completedCandidates(), true);
  if (ids.length === 0) return [];
  const rows = await db
    .select({
      studentId: studentProfiles.id,
      name: user.name,
      major: studentProfiles.major,
      school: organizations.name,
      enrollmentId: enrollments.id,
      classification: jobClassifications.title,
    })
    .from(studentProfiles)
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .innerJoin(enrollments, and(eq(enrollments.studentId, studentProfiles.id), eq(enrollments.status, "completed")))
    .leftJoin(organizations, eq(organizations.id, studentProfiles.collegeOrgId))
    .leftJoin(jobClassifications, eq(jobClassifications.id, enrollments.classificationId))
    .where(inArray(studentProfiles.id, ids))
    .orderBy(asc(user.name));
  const pending = await db
    .select({ studentId: vendorInterest.studentId })
    .from(vendorInterest)
    .where(and(eq(vendorInterest.vendorOrgId, firm.orgId), eq(vendorInterest.studentResponse, "pending"), inArray(vendorInterest.studentId, ids)));
  const pendingIds = new Set(pending.map((p) => p.studentId));

  const cards: CompleterCard[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.studentId)) continue;
    seen.add(row.studentId);
    const view = await getEnrollmentView(row.enrollmentId);
    cards.push({
      studentId: row.studentId,
      name: row.name,
      school: row.school ?? "",
      major: row.major ?? "",
      classification: row.classification ?? "",
      atBar: view?.derived.atBar ?? 0,
      pendingRequest: pendingIds.has(row.studentId),
    });
  }
  return cards;
}

export async function listFirmInterviews(firm: FirmContext) {
  return db
    .select({
      id: vendorInterest.id,
      studentId: vendorInterest.studentId,
      name: user.name,
      requestedAt: vendorInterest.requestedAt,
      studentResponse: vendorInterest.studentResponse,
      interviewAt: vendorInterest.interviewAt,
      outcome: vendorInterest.outcome,
    })
    .from(vendorInterest)
    .innerJoin(studentProfiles, eq(studentProfiles.id, vendorInterest.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .where(eq(vendorInterest.vendorOrgId, firm.orgId))
    .orderBy(desc(vendorInterest.requestedAt));
}
