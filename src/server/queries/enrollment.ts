import "server-only";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import {
  confirmedReferences,
  countedHours,
  currentWeek,
  displayWeek,
  earningsCents,
  latestLevels,
  orderDueItems,
  poolEligibility,
  ratingDueState,
  skillsAtBar,
  weekStart,
  type DueItem,
  type Level,
} from "@/domain/rules";
import { addDays, localDate } from "@/domain/time";
import { consentState } from "../authz";
import { db } from "../db";
import {
  competencies,
  enrollments,
  hoursEntries,
  jobClassifications,
  organizations,
  poolEntries,
  programs,
  ratingScores,
  references,
  skillEvidence,
  sponsorMeetings,
  studentProfiles,
  teachingUnits,
  user,
  weeklyRatings,
  workSamples,
} from "../db/schema";

export async function getProgram() {
  const [program] = await db.select().from(programs).limit(1);
  return program;
}

export type Program = NonNullable<Awaited<ReturnType<typeof getProgram>>>;

/** The student's most relevant enrollment: active first, then completed, then proposed. */
export async function primaryEnrollmentId(studentId: string): Promise<string | null> {
  const rows = await db
    .select({ id: enrollments.id, status: enrollments.status, createdAt: enrollments.createdAt })
    .from(enrollments)
    .where(and(eq(enrollments.studentId, studentId), ne(enrollments.status, "withdrawn")))
    .orderBy(desc(enrollments.createdAt));
  const order = ["active", "completed", "proposed"];
  rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return rows[0]?.id ?? null;
}

export async function getStudentProfileByUser(userId: string) {
  const [row] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  return row ?? null;
}

/** Everything a transcript or rotation home needs for one enrollment, with derived values. */
export async function getEnrollmentView(enrollmentId: string, now = new Date()) {
  const [base] = await db
    .select({
      enrollment: enrollments,
      profile: studentProfiles,
      student: { id: user.id, name: user.name, email: user.email },
      unit: teachingUnits,
      classification: jobClassifications,
      college: { id: organizations.id, name: organizations.name },
    })
    .from(enrollments)
    .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .leftJoin(teachingUnits, eq(teachingUnits.id, enrollments.unitId))
    .leftJoin(jobClassifications, eq(jobClassifications.id, enrollments.classificationId))
    .leftJoin(organizations, eq(organizations.id, studentProfiles.collegeOrgId))
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
  if (!base) return null;
  const program = await getProgram();
  const tz = program.timeZone;
  const [city] = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, program.cityOrgId)).limit(1);

  const staffIds = [base.enrollment.preceptorId, base.enrollment.sponsorId].filter((x): x is string => !!x);
  const staff = staffIds.length ? await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, staffIds)) : [];
  const preceptor = staff.find((x) => x.id === base.enrollment.preceptorId) ?? null;
  const sponsor = staff.find((x) => x.id === base.enrollment.sponsorId) ?? null;

  const [comps, hours, ratingRows, evidence, samples, refs, meetings, consent, pool] = await Promise.all([
    base.enrollment.classificationId
      ? db
          .select()
          .from(competencies)
          .where(eq(competencies.classificationId, base.enrollment.classificationId))
          .orderBy(asc(competencies.position))
      : Promise.resolve([]),
    db.select().from(hoursEntries).where(eq(hoursEntries.enrollmentId, enrollmentId)).orderBy(desc(hoursEntries.week)),
    db.select().from(weeklyRatings).where(eq(weeklyRatings.enrollmentId, enrollmentId)).orderBy(asc(weeklyRatings.week)),
    db.select().from(skillEvidence).where(eq(skillEvidence.enrollmentId, enrollmentId)),
    db.select().from(workSamples).where(eq(workSamples.enrollmentId, enrollmentId)).orderBy(desc(workSamples.week)),
    db.select().from(references).where(eq(references.enrollmentId, enrollmentId)).orderBy(asc(references.askedAt)),
    db.select().from(sponsorMeetings).where(eq(sponsorMeetings.enrollmentId, enrollmentId)).orderBy(asc(sponsorMeetings.scheduledAt)),
    consentState(base.profile.id),
    db.select().from(poolEntries).where(eq(poolEntries.enrollmentId, enrollmentId)).limit(1),
  ]);

  const scores = ratingRows.length
    ? await db.select().from(ratingScores).where(inArray(ratingScores.ratingId, ratingRows.map((r) => r.id)))
    : [];
  const ratings = ratingRows.map((r) => ({
    ...r,
    scores: scores.filter((x) => x.ratingId === r.id).map((x) => ({ competencyId: x.competencyId, level: x.level })),
  }));

  const verifierIds = [...new Set(samples.map((x) => x.verifiedBy).filter((x): x is string => !!x))];
  const verifiers = verifierIds.length ? await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, verifierIds)) : [];

  const startDate = base.enrollment.startDate;
  const rawWeek = startDate ? currentWeek(startDate, now, tz) : 0;
  const week = startDate ? displayWeek(startDate, now, tz, program.weeks) : 0;
  const completed = base.enrollment.status === "completed";
  const latest = latestLevels(ratings);
  const competencyIds = comps.map((c) => c.id);
  const atBar = skillsAtBar(latest, competencyIds);
  const confirmed = confirmedReferences(refs);
  const eligibility = poolEligibility({
    enrollmentStatus: base.enrollment.status,
    latest,
    competencyIds,
    confirmedRefs: confirmed,
    referencesRequired: program.referencesRequired,
    shareCityHr: consent.share_city_hr,
  });
  const thisWeekHours = hours.find((h) => h.week === rawWeek) ?? null;
  const ratedThisWeek = ratings.find((r) => r.week === rawWeek && r.submittedAt);
  const totalHours = countedHours(hours);
  const today = localDate(now, tz);

  const meetingThisWeek =
    startDate && rawWeek >= 1
      ? meetings.find((m) => {
          if (m.completedAt) return false;
          const d = localDate(m.scheduledAt, tz);
          const ws = weekStart(startDate, rawWeek);
          return d >= ws && d <= addDays(ws, 6);
        }) ?? null
      : null;

  const due: DueItem[] = [];
  if (base.enrollment.status === "active" && startDate && rawWeek >= 1 && rawWeek <= program.weeks) {
    const state = ratingDueState(startDate, rawWeek, now, tz);
    if (!ratedThisWeek) due.push({ kind: "rating", state });
    if (!thisWeekHours) due.push({ kind: "hours", state });
    if (meetingThisWeek) due.push({ kind: "meeting", state: localDate(meetingThisWeek.scheduledAt, tz) < today ? "overdue" : "due" });
  }

  return {
    program,
    cityName: city?.name ?? "",
    enrollment: base.enrollment,
    profile: base.profile,
    student: { ...base.student, firstName: base.student.name.split(" ")[0] },
    unit: base.unit,
    classification: base.classification,
    college: base.college,
    preceptor,
    sponsor,
    competencies: comps,
    hours,
    ratings,
    evidence,
    samples: samples.map((x) => ({ ...x, verifierName: verifiers.find((v) => v.id === x.verifiedBy)?.name ?? null })),
    references: refs,
    meetings,
    consent,
    poolEntry: pool[0] ?? null,
    derived: {
      rawWeek,
      week,
      weeksLeft: Math.max(program.weeks - week, 0),
      completed,
      thisWeekHours,
      totalHours,
      earnedCents: earningsCents(hours, program.payRateCents),
      latest: latest as Map<string, Level>,
      atBar,
      confirmed,
      eligibility,
      dueItems: orderDueItems(due),
      meetingThisWeek,
      nextMeeting: meetings.find((m) => !m.completedAt && m.scheduledAt >= now) ?? null,
    },
  };
}

export type EnrollmentView = NonNullable<Awaited<ReturnType<typeof getEnrollmentView>>>;
