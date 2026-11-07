import "server-only";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { computeMetrics, type MetricResult, type MetricStudent } from "@/domain/metrics";
import { confirmedReferences, timeToOfferDays } from "@/domain/rules";
import { db } from "../db";
import {
  cohorts,
  consents,
  enrollments,
  openingInvites,
  outcomeSurveys,
  poolEntries,
  programs,
  references,
  studentProfiles,
  vendorInterest,
} from "../db/schema";

export const COHORT_TERMS = ["Spring 2026", "Fall 2026"] as const;

/** Distinct cohort term names, oldest first by start date. */
export async function cohortTerms(): Promise<string[]> {
  const rows = await db.select({ termName: cohorts.termName, startDate: cohorts.startDate }).from(cohorts);
  const seen = new Map<string, string>();
  for (const r of rows) if (!seen.has(r.termName) || r.startDate < seen.get(r.termName)!) seen.set(r.termName, r.startDate);
  return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([t]) => t);
}

/** Builds the per-student inputs for the five success metrics (Content Pack 13.5). */
export async function metricStudents(termName: string, collegeOrgId?: string) {
  const cohortRows = await db
    .select()
    .from(cohorts)
    .where(collegeOrgId ? and(eq(cohorts.termName, termName), eq(cohorts.collegeOrgId, collegeOrgId)) : eq(cohorts.termName, termName));
  if (cohortRows.length === 0) return { students: [] as MetricStudent[], completed: false, exists: false };
  const completed = cohortRows.every((c) => c.status === "completed");
  const [program] = await db.select().from(programs).limit(1);
  const tz = program?.timeZone ?? "America/Chicago";

  const enrolls = await db
    .select({ enrollment: enrollments, profile: studentProfiles })
    .from(enrollments)
    .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
    .where(inArray(enrollments.cohortId, cohortRows.map((c) => c.id)));
  if (enrolls.length === 0) return { students: [] as MetricStudent[], completed, exists: true };

  const enrollmentIds = enrolls.map((e) => e.enrollment.id);
  const studentIds = [...new Set(enrolls.map((e) => e.profile.id))];

  const [consentRows, refRows, poolRows, interestRows, surveyRows] = await Promise.all([
    db
      .select()
      .from(consents)
      .where(and(inArray(consents.studentId, studentIds), eq(consents.type, "demographic_reporting"))),
    db.select({ enrollmentId: references.enrollmentId, status: references.status }).from(references).where(inArray(references.enrollmentId, enrollmentIds)),
    db.select().from(poolEntries).where(inArray(poolEntries.enrollmentId, enrollmentIds)),
    db
      .select()
      .from(vendorInterest)
      .where(and(inArray(vendorInterest.studentId, studentIds), isNotNull(vendorInterest.interviewAt), eq(vendorInterest.studentResponse, "accepted"))),
    db.select().from(outcomeSurveys).where(and(inArray(outcomeSurveys.studentId, studentIds), eq(outcomeSurveys.monthsAfter, 12))),
  ]);
  const invites = poolRows.length
    ? await db.select().from(openingInvites).where(inArray(openingInvites.poolEntryId, poolRows.map((p) => p.id)))
    : [];

  const latestConsent = new Map<string, { granted: boolean; at: number }>();
  for (const c of consentRows) {
    const at = c.createdAt.getTime();
    const prev = latestConsent.get(c.studentId);
    if (!prev || at >= prev.at) latestConsent.set(c.studentId, { granted: c.granted, at });
  }

  const students: MetricStudent[] = enrolls.map(({ enrollment, profile }) => {
    const pool = poolRows.find((p) => p.enrollmentId === enrollment.id);
    const myInvites = pool ? invites.filter((i) => i.poolEntryId === pool.id) : [];
    const offers = myInvites.filter((i) => i.offerAt).map((i) => i.offerAt!.getTime()).sort((a, b) => a - b);
    const survey = surveyRows.find((s) => s.studentId === profile.id && !s.isComparisonPeer);
    return {
      status: enrollment.status,
      demographicConsent: latestConsent.get(profile.id)?.granted ?? false,
      firstGen: profile.firstGen,
      pell: profile.pell,
      confirmedRefs: confirmedReferences(refRows.filter((r) => r.enrollmentId === enrollment.id)),
      offerDays: pool && offers.length ? timeToOfferDays(pool.enteredAt, new Date(offers[0]), tz) : null,
      hiredByCity: myInvites.some((i) => i.acceptedAt),
      vendorInterview: interestRows.some((v) => v.studentId === profile.id),
      underemployed12: survey && survey.employed !== null ? !!survey.employed && !survey.collegeLevelJob : null,
      peer: false,
    };
  });

  // Matched peers come from the college outcomes survey, flagged as comparison peers.
  const peerRows = surveyRows.filter((s) => s.isComparisonPeer);
  for (const p of peerRows) {
    students.push({
      status: "completed",
      demographicConsent: false,
      firstGen: null,
      pell: null,
      confirmedRefs: 0,
      offerDays: null,
      hiredByCity: false,
      vendorInterview: false,
      underemployed12: p.employed !== null ? !!p.employed && !p.collegeLevelJob : null,
      peer: true,
    });
  }

  return { students, completed, exists: true };
}

export async function cohortMetrics(termName: string, collegeOrgId?: string): Promise<{ metrics: MetricResult[]; exists: boolean }> {
  const { students, completed, exists } = await metricStudents(termName, collegeOrgId);
  return { metrics: computeMetrics(students, completed), exists };
}
