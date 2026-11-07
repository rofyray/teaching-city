import { timingSafeEqual } from "node:crypto";
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { currentWeek, timeToOfferDays } from "@/domain/rules";
import { notify, type NotificationType } from "@/server/audit";
import { db } from "@/server/db";
import {
  enrollments,
  hoursEntries,
  memberships,
  notifications,
  openingInvites,
  openings,
  poolEntries,
  studentProfiles,
  user,
  weeklyRatings,
} from "@/server/db/schema";
import { sendNotificationEmail } from "@/server/email";
import { evaluatePoolEligibility } from "@/server/eligibility";
import { getProgram } from "@/server/queries/enrollment";

export const dynamic = "force-dynamic";

async function alreadyNotified(userId: string, type: NotificationType, match: Record<string, string | number>, unreadOnly = false) {
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, type),
        sql`${notifications.payload} @> ${JSON.stringify(match)}::jsonb`,
        unreadOnly ? isNull(notifications.readAt) : undefined,
      ),
    )
    .limit(1);
  return !!row;
}

async function send(userId: string, type: NotificationType, payload: Record<string, string | number>) {
  await notify(userId, type, payload);
  await sendNotificationEmail(userId, type, payload);
}

/** Thursday 9 AM program time: rating reminders to preceptors and hours reminders to students. */
async function weekly(now: Date) {
  const program = await getProgram();
  const rows = await db
    .select({
      id: enrollments.id,
      startDate: enrollments.startDate,
      preceptorId: enrollments.preceptorId,
      studentUserId: studentProfiles.userId,
      name: user.name,
    })
    .from(enrollments)
    .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .where(eq(enrollments.status, "active"));
  const ids = rows.map((r) => r.id);
  const rated = ids.length
    ? await db
        .select({ enrollmentId: weeklyRatings.enrollmentId, week: weeklyRatings.week })
        .from(weeklyRatings)
        .where(and(inArray(weeklyRatings.enrollmentId, ids), isNotNull(weeklyRatings.submittedAt)))
    : [];
  const logged = ids.length
    ? await db.select({ enrollmentId: hoursEntries.enrollmentId, week: hoursEntries.week }).from(hoursEntries).where(inArray(hoursEntries.enrollmentId, ids))
    : [];

  let ratingDue = 0;
  let hoursReminder = 0;
  for (const row of rows) {
    if (!row.startDate) continue;
    const week = currentWeek(row.startDate, now, program.timeZone);
    if (week < 1 || week > program.weeks) continue;
    if (row.preceptorId && !rated.some((r) => r.enrollmentId === row.id && r.week === week)) {
      const payload = { firstName: row.name.split(" ")[0], week, href: `/m/rate/${row.id}/${week}` };
      if (!(await alreadyNotified(row.preceptorId, "ratingDue", { href: payload.href }))) {
        await send(row.preceptorId, "ratingDue", payload);
        ratingDue++;
      }
    }
    if (!logged.some((h) => h.enrollmentId === row.id && h.week === week)) {
      if (!(await alreadyNotified(row.studentUserId, "hoursReminder", { week }))) {
        await send(row.studentUserId, "hoursReminder", { week, href: "/s/hours" });
        hoursReminder++;
      }
    }
  }
  return { ratingDue, hoursReminder };
}

/** Daily: re-evaluate eligibility for completers and flag invites past the offer target. */
async function daily(now: Date) {
  const program = await getProgram();
  const completed = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.status, "completed"));
  let poolChanges = 0;
  for (const row of completed) {
    const result = await evaluatePoolEligibility(row.id, "sweep");
    if (result.changed) poolChanges++;
  }

  const invites = await db
    .select({
      id: openingInvites.id,
      enteredAt: poolEntries.enteredAt,
      opening: openings.title,
      name: user.name,
    })
    .from(openingInvites)
    .innerJoin(poolEntries, eq(poolEntries.id, openingInvites.poolEntryId))
    .innerJoin(openings, eq(openings.id, openingInvites.openingId))
    .innerJoin(studentProfiles, eq(studentProfiles.id, poolEntries.studentId))
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .where(and(isNull(openingInvites.offerAt), isNull(openingInvites.declinedAt)));
  const coordinators = await db
    .selectDistinct({ userId: memberships.userId })
    .from(memberships)
    .where(eq(memberships.role, "city_coordinator"));

  let pastTarget = 0;
  for (const invite of invites) {
    if (timeToOfferDays(invite.enteredAt, now, program.timeZone) <= program.offerTargetDays) continue;
    const payload = { name: invite.name, opening: invite.opening, days: program.offerTargetDays, href: "/city/openings" };
    for (const c of coordinators) {
      if (await alreadyNotified(c.userId, "invitePastTarget", { name: payload.name, opening: payload.opening }, true)) continue;
      await send(c.userId, "invitePastTarget", payload);
      pastTarget++;
    }
  }
  return { poolChanges, invitePastTarget: pastTarget };
}

const JOBS: Record<string, (now: Date) => Promise<Record<string, number>>> = { weekly, daily };

/** Constant-time comparison so response timing does not leak the secret. */
function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ job: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !sameSecret(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { job } = await params;
  const run = JOBS[job];
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const result = await run(new Date());
  console.info(JSON.stringify({ event: "cron", job, ...result }));
  return NextResponse.json({ job, ...result });
}
