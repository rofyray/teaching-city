import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { currentWeek, ratingDueState, type DueState } from "@/domain/rules";
import { localDate } from "@/domain/time";
import { db } from "../db";
import { enrollments, references, sponsorMeetings, studentProfiles, teachingUnits, user, weeklyRatings } from "../db/schema";
import { getProgram } from "./enrollment";

export type MentorStudent = {
  enrollmentId: string;
  studentId: string;
  name: string;
  firstName: string;
  unitName: string;
  lineLetter: string;
  lineColor: string;
  week: number;
  dueWeek: number | null;
  dueState: DueState | null;
  isPreceptor: boolean;
  isSponsor: boolean;
};

/** Students assigned to this mentor, with the oldest unrated week as the one due. */
export async function getMentorStudents(userId: string, now = new Date()): Promise<MentorStudent[]> {
  const program = await getProgram();
  const rows = await db
    .select({ enrollment: enrollments, name: user.name, unit: teachingUnits })
    .from(enrollments)
    .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .leftJoin(teachingUnits, eq(teachingUnits.id, enrollments.unitId))
    .where(and(eq(enrollments.status, "active"), or(eq(enrollments.preceptorId, userId), eq(enrollments.sponsorId, userId))));
  if (rows.length === 0) return [];
  const ratings = await db
    .select({ enrollmentId: weeklyRatings.enrollmentId, week: weeklyRatings.week, submittedAt: weeklyRatings.submittedAt })
    .from(weeklyRatings)
    .where(inArray(weeklyRatings.enrollmentId, rows.map((r) => r.enrollment.id)));
  return rows
    .map(({ enrollment, name, unit }) => {
      const start = enrollment.startDate!;
      const week = Math.min(currentWeek(start, now, program.timeZone), program.weeks);
      const rated = new Set(ratings.filter((r) => r.enrollmentId === enrollment.id && r.submittedAt).map((r) => r.week));
      let dueWeek: number | null = null;
      for (let w = 1; w <= week; w++) {
        if (!rated.has(w)) {
          dueWeek = w;
          break;
        }
      }
      return {
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        name,
        firstName: name.split(" ")[0],
        unitName: unit?.name ?? "",
        lineLetter: unit?.lineLetter ?? "",
        lineColor: unit?.lineColor ?? "finance",
        week,
        dueWeek,
        dueState: dueWeek ? ratingDueState(start, dueWeek, now, program.timeZone) : null,
        isPreceptor: enrollment.preceptorId === userId,
        isSponsor: enrollment.sponsorId === userId,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSponsorMeetings(userId: string) {
  return db
    .select({ meeting: sponsorMeetings, name: user.name, enrollmentId: enrollments.id })
    .from(sponsorMeetings)
    .innerJoin(enrollments, eq(enrollments.id, sponsorMeetings.enrollmentId))
    .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .where(eq(sponsorMeetings.sponsorId, userId))
    .orderBy(sponsorMeetings.scheduledAt);
}

export function meetingsHeldThisMonth(meetings: { completedAt: Date | null }[], now: Date, timeZone: string) {
  const month = localDate(now, timeZone).slice(0, 7);
  return meetings.filter((m) => m.completedAt && localDate(m.completedAt, timeZone).slice(0, 7) === month).length;
}

export async function getReferenceRequests(userId: string) {
  return db
    .select({ reference: references, name: user.name })
    .from(references)
    .innerJoin(enrollments, eq(enrollments.id, references.enrollmentId))
    .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .where(eq(references.refereeUserId, userId))
    .orderBy(references.askedAt);
}
