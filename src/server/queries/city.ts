import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { currentWeek, matchSuggestions, ratingDueState, windowHours, type MatchSuggestion } from "@/domain/rules";
import { notFound } from "next/navigation";
import { consentState } from "../authz";
import { db } from "../db";
import {
  cohorts,
  enrollments,
  hoursEntries,
  jobClassifications,
  memberships,
  openingInvites,
  openings,
  organizations,
  poolEntries,
  studentProfiles,
  teachingUnits,
  unitMajorMap,
  user,
  vendorInterest,
  vendorPledges,
  weeklyRatings,
} from "../db/schema";
import { requireRole } from "../session";
import { getProgram } from "./enrollment";

export async function listUnits() {
  const units = await db.select().from(teachingUnits).orderBy(asc(teachingUnits.name));
  const majors = await db.select().from(unitMajorMap);
  const active = await db
    .select({ unitId: enrollments.unitId, preceptorId: enrollments.preceptorId, status: enrollments.status })
    .from(enrollments)
    .where(ne(enrollments.status, "withdrawn"));
  const classes = await db.select().from(jobClassifications);
  const preceptorIds = [...new Set(active.map((a) => a.preceptorId).filter((x): x is string => !!x))];
  const people = preceptorIds.length
    ? await db
        .select({ id: user.id, name: user.name, title: memberships.title })
        .from(user)
        .innerJoin(memberships, and(eq(memberships.userId, user.id), eq(memberships.role, "preceptor")))
        .where(inArray(user.id, preceptorIds))
    : [];
  return units.map((u) => {
    const ids = [...new Set(active.filter((a) => a.unitId === u.id).map((a) => a.preceptorId))];
    return {
      ...u,
      majors: majors.filter((m) => m.unitId === u.id).map((m) => m.majorCategory as string),
      filled: active.filter((a) => a.unitId === u.id && a.status === "active").length,
      classification: classes.find((c) => c.unitId === u.id) ?? null,
      preceptors: people.filter((p) => ids.includes(p.id)).sort((a, b) => a.name.localeCompare(b.name)),
    };
  });
}

export type UnitRow = Awaited<ReturnType<typeof listUnits>>[number];

export async function activeEnrollments() {
  return db
    .select({
      id: enrollments.id,
      startDate: enrollments.startDate,
      unitId: enrollments.unitId,
      studentName: user.name,
      unitName: teachingUnits.name,
      lineColor: teachingUnits.lineColor,
      lineLetter: teachingUnits.lineLetter,
    })
    .from(enrollments)
    .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .leftJoin(teachingUnits, eq(teachingUnits.id, enrollments.unitId))
    .where(eq(enrollments.status, "active"))
    .orderBy(asc(teachingUnits.name), asc(user.name));
}

export async function getOverview(now = new Date()) {
  const program = await getProgram();
  const active = await activeEnrollments();
  const ratings = active.length
    ? await db
        .select({ enrollmentId: weeklyRatings.enrollmentId, week: weeklyRatings.week, submittedAt: weeklyRatings.submittedAt })
        .from(weeklyRatings)
        .where(inArray(weeklyRatings.enrollmentId, active.map((a) => a.id)))
    : [];
  const overdue = active.filter((e) => {
    if (!e.startDate) return false;
    const last = Math.min(currentWeek(e.startDate, now, program.timeZone), program.weeks);
    for (let w = 1; w <= last; w++) {
      const rated = ratings.some((r) => r.enrollmentId === e.id && r.week === w && r.submittedAt);
      if (!rated && ratingDueState(e.startDate, w, now, program.timeZone) === "overdue") return true;
    }
    return false;
  });
  const pool = await db.select({ id: poolEntries.id }).from(poolEntries).where(inArray(poolEntries.status, ["active", "offered"]));
  const pending = await db.select({ id: vendorInterest.id }).from(vendorInterest).where(eq(vendorInterest.studentResponse, "pending"));
  return {
    program,
    active: active.map((a) => ({
      ...a,
      week: a.startDate ? Math.min(Math.max(currentWeek(a.startDate, now, program.timeZone), 1), program.weeks) : 0,
    })),
    overdue,
    poolSize: pool.length,
    openRequests: pending.length,
    units: await listUnits(),
  };
}

export async function cityStaff() {
  const rows = await db
    .select({ id: user.id, name: user.name, role: memberships.role, title: memberships.title })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(and(eq(organizations.type, "city"), inArray(memberships.role, ["preceptor", "sponsor"])))
    .orderBy(asc(user.name));
  return {
    preceptors: rows.filter((r) => r.role === "preceptor"),
    sponsors: rows.filter((r) => r.role === "sponsor"),
  };
}

export type UnmatchedStudent = {
  profileId: string;
  name: string;
  major: string | null;
  majorCategory: string | null;
  collegeName: string | null;
  free: number;
  suggestions: MatchSuggestion[];
  courseMapping: { classificationCode: string; reason: string; courses: string[] }[] | null;
};

/** Onboarded students with both required consents and no active or completed enrollment. */
export async function unmatchedStudents(): Promise<UnmatchedStudent[]> {
  const profiles = await db
    .select({ profile: studentProfiles, name: user.name, collegeName: organizations.name })
    .from(studentProfiles)
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .leftJoin(organizations, eq(organizations.id, studentProfiles.collegeOrgId));
  const onboarded = profiles.filter((p) => p.profile.onboardedAt);
  if (onboarded.length === 0) return [];
  const enrolls = await db
    .select({ studentId: enrollments.studentId, status: enrollments.status })
    .from(enrollments)
    .where(inArray(enrollments.studentId, onboarded.map((p) => p.profile.id)));
  const units = await listUnits();
  const out: UnmatchedStudent[] = [];
  for (const p of onboarded) {
    const mine = enrolls.filter((e) => e.studentId === p.profile.id && e.status !== "withdrawn" && e.status !== "proposed");
    if (mine.length > 0) continue;
    const consent = await consentState(p.profile.id);
    if (!consent.program_participation || !consent.share_city_hr) continue;
    out.push({
      profileId: p.profile.id,
      name: p.name,
      major: p.profile.major,
      majorCategory: p.profile.majorCategory,
      collegeName: p.collegeName,
      free: windowHours(p.profile.availability),
      suggestions: matchSuggestions(
        { majorCategory: p.profile.majorCategory, availability: p.profile.availability },
        units.map((u) => ({ id: u.id, name: u.name, majors: u.majors, capacity: u.capacity, filled: u.filled, scheduleWindows: u.scheduleWindows })),
      ),
      courseMapping: p.profile.courseMapping ?? null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listClassifications() {
  const rows = await db
    .select({ cls: jobClassifications, unitName: teachingUnits.name, lineColor: teachingUnits.lineColor, lineLetter: teachingUnits.lineLetter })
    .from(jobClassifications)
    .leftJoin(teachingUnits, eq(teachingUnits.id, jobClassifications.unitId))
    .orderBy(asc(jobClassifications.code));
  return rows;
}

export async function listPool(classificationId?: string) {
  const rows = await db
    .select({
      id: poolEntries.id,
      enteredAt: poolEntries.enteredAt,
      status: poolEntries.status,
      classificationId: poolEntries.classificationId,
      classification: jobClassifications.title,
      name: user.name,
      unitName: teachingUnits.name,
      lineColor: teachingUnits.lineColor,
      lineLetter: teachingUnits.lineLetter,
    })
    .from(poolEntries)
    .innerJoin(studentProfiles, eq(studentProfiles.id, poolEntries.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .innerJoin(enrollments, eq(enrollments.id, poolEntries.enrollmentId))
    .leftJoin(teachingUnits, eq(teachingUnits.id, enrollments.unitId))
    .leftJoin(jobClassifications, eq(jobClassifications.id, poolEntries.classificationId))
    .where(
      classificationId
        ? and(ne(poolEntries.status, "withdrawn"), eq(poolEntries.classificationId, classificationId))
        : ne(poolEntries.status, "withdrawn"),
    )
    .orderBy(asc(poolEntries.enteredAt), asc(user.name));
  return rows;
}

export async function listOpenings() {
  const rows = await db
    .select({ opening: openings, classification: jobClassifications.title })
    .from(openings)
    .leftJoin(jobClassifications, eq(jobClassifications.id, openings.classificationId))
    .orderBy(asc(openings.status), asc(openings.title));
  const invites = rows.length
    ? await db
        .select({
          invite: openingInvites,
          name: user.name,
          enteredAt: poolEntries.enteredAt,
          poolStatus: poolEntries.status,
        })
        .from(openingInvites)
        .innerJoin(poolEntries, eq(poolEntries.id, openingInvites.poolEntryId))
        .innerJoin(studentProfiles, eq(studentProfiles.id, poolEntries.studentId))
        .innerJoin(user, eq(user.id, studentProfiles.userId))
        .where(inArray(openingInvites.openingId, rows.map((r) => r.opening.id)))
        .orderBy(asc(user.name))
    : [];
  // Open first, then the rest, newest posted first within each group.
  const order = { open: 0, draft: 1, filled: 2, closed: 3 } as const;
  return rows
    .sort((a, b) => order[a.opening.status] - order[b.opening.status] || (b.opening.postedAt?.getTime() ?? 0) - (a.opening.postedAt?.getTime() ?? 0))
    .map((r) => ({ ...r, invites: invites.filter((i) => i.invite.openingId === r.opening.id) }));
}

export async function listVendors(now = new Date()) {
  const rows = await db
    .select({ pledge: vendorPledges, vendorName: organizations.name })
    .from(vendorPledges)
    .innerJoin(organizations, eq(organizations.id, vendorPledges.vendorOrgId))
    .orderBy(asc(organizations.name));
  return rows.map((r) => ({ ...r, active: r.pledge.pledgedAt <= now && (!r.pledge.endedAt || r.pledge.endedAt > now) }));
}

export async function activeCohortFor(collegeOrgId: string | null) {
  const rows = await db.select().from(cohorts).where(eq(cohorts.status, "active"));
  return rows.find((c) => c.collegeOrgId === collegeOrgId) ?? rows[0] ?? null;
}

/** College view (P4.5): students in the coordinator's college with consent and credit status. */
export async function collegeCohort(collegeOrgId: string, termName: string | undefined, now = new Date()) {
  const program = await getProgram();
  const cohortRows = await db.select().from(cohorts).where(eq(cohorts.collegeOrgId, collegeOrgId));
  const terms = [...new Set(cohortRows.sort((a, b) => b.startDate.localeCompare(a.startDate)).map((c) => c.termName))];
  const term = termName && terms.includes(termName) ? termName : (cohortRows.find((c) => c.status === "active")?.termName ?? terms[0]);
  const cohortIds = cohortRows.filter((c) => c.termName === term).map((c) => c.id);
  const rows = cohortIds.length
    ? await db
        .select({
          enrollment: enrollments,
          profileId: studentProfiles.id,
          name: user.name,
          major: studentProfiles.major,
          unitName: teachingUnits.name,
          lineColor: teachingUnits.lineColor,
          lineLetter: teachingUnits.lineLetter,
        })
        .from(enrollments)
        .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
        .innerJoin(user, eq(user.id, studentProfiles.userId))
        .leftJoin(teachingUnits, eq(teachingUnits.id, enrollments.unitId))
        .where(and(inArray(enrollments.cohortId, cohortIds), eq(studentProfiles.collegeOrgId, collegeOrgId)))
        .orderBy(asc(user.name))
    : [];
  const hours = rows.length
    ? await db
        .select({ enrollmentId: hoursEntries.enrollmentId, hours: hoursEntries.hours, submittedAt: hoursEntries.submittedAt, approvedAt: hoursEntries.approvedAt })
        .from(hoursEntries)
        .where(inArray(hoursEntries.enrollmentId, rows.map((r) => r.enrollment.id)))
    : [];
  const students = [];
  for (const r of rows) {
    const consent = await consentState(r.profileId);
    const total = hours
      .filter((h) => h.enrollmentId === r.enrollment.id && (h.submittedAt || h.approvedAt))
      .reduce((s, h) => s + Number(h.hours), 0);
    let weeksElapsed = 0;
    if (r.enrollment.startDate) {
      const week = currentWeek(r.enrollment.startDate, now, program.timeZone);
      // Weeks before the current one count as elapsed; a finished rotation counts every week.
      weeksElapsed = r.enrollment.status === "active" ? Math.min(Math.max(week - 1, 0), program.weeks) : program.weeks;
      if (r.enrollment.status === "withdrawn") weeksElapsed = 0;
    }
    students.push({
      ...r,
      consentOk: consent.program_participation && consent.share_city_hr,
      hours: total,
      weeksElapsed,
    });
  }
  return { program, term, terms, students };
}

/** The coordinator's own college. College views never read another college's data (P4.5, P12.3). */
export async function requireCollege() {
  const current = await requireRole("college_coordinator");
  const membership = current.memberships.find((m) => m.role === "college_coordinator");
  if (!membership) notFound();
  return { current, collegeOrgId: membership.organizationId, collegeName: membership.organizationName };
}
