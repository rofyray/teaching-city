"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { canEditRating } from "@/domain/rules";
import { zonedTime } from "@/domain/time";
import { markAiAccepted } from "../ai/client";
import { audit, notify } from "../audit";
import { assertCanEnrollment, ForbiddenError } from "../authz";
import { db } from "../db";
import {
  enrollments,
  hoursEntries,
  ratingScores,
  references,
  skillEvidence,
  sponsorMeetings,
  studentProfiles,
  weeklyRatings,
  workSamples,
} from "../db/schema";
import { evaluatePoolEligibility } from "../eligibility";
import { getEnrollmentView } from "../queries/enrollment";
import { requireRole } from "../session";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string; fields?: Record<string, string> };

const RatingInput = z.object({
  enrollmentId: z.string().min(1),
  week: z.number().int().min(1).max(30),
  levels: z.record(z.string(), z.number().int().min(1).max(4)),
  note: z.string().max(600),
  noteAiAssisted: z.boolean(),
  aiEventId: z.string().nullable(),
  evidence: z.array(z.object({ competencyId: z.string(), sentence: z.string().trim().min(1).max(200) })).max(5),
});

/** P6.4: submit or edit a weekly rating with a signed note (BR-6). */
export async function submitRating(raw: z.input<typeof RatingInput>): Promise<ActionResult> {
  const current = await requireRole("preceptor");
  const input = RatingInput.parse(raw);
  await assertCanEnrollment(current, "ratings", "write", input.enrollmentId);
  const view = await getEnrollmentView(input.enrollmentId);
  if (!view || view.enrollment.preceptorId !== current.id) throw new ForbiddenError();
  if (input.week > Math.max(view.derived.rawWeek, 1) || input.week > view.program.weeks) return { ok: false, error: "generic" };

  const competencyIds = view.competencies.map((c) => c.id);
  const missing = competencyIds.filter((id) => !input.levels[id]);
  if (missing.length > 0) return { ok: false, error: "missing", fields: Object.fromEntries(missing.map((id) => [id, "missing"])) };

  const submittedWeeks = view.ratings.filter((r) => r.submittedAt).map((r) => r.week);
  const existing = view.ratings.find((r) => r.week === input.week);
  if (existing?.submittedAt && !canEditRating(input.week, submittedWeeks)) return { ok: false, error: "generic" };

  const now = new Date();
  await db.transaction(async (tx) => {
    const values = {
      enrollmentId: input.enrollmentId,
      week: input.week,
      preceptorId: current.id,
      note: input.note.trim() || null,
      noteAiAssisted: input.noteAiAssisted,
      signatureName: current.name,
      signedAt: now,
      submittedAt: now,
    };
    const [rating] = await tx
      .insert(weeklyRatings)
      .values(values)
      .onConflictDoUpdate({ target: [weeklyRatings.enrollmentId, weeklyRatings.week], set: values })
      .returning({ id: weeklyRatings.id });
    await tx.delete(ratingScores).where(eq(ratingScores.ratingId, rating.id));
    await tx.insert(ratingScores).values(competencyIds.map((id) => ({ ratingId: rating.id, competencyId: id, level: input.levels[id] })));
    for (const e of input.evidence) {
      if (!competencyIds.includes(e.competencyId)) continue;
      await tx
        .insert(skillEvidence)
        .values({ enrollmentId: input.enrollmentId, competencyId: e.competencyId, sentence: e.sentence, authorId: current.id, aiAssisted: true })
        .onConflictDoUpdate({
          target: [skillEvidence.enrollmentId, skillEvidence.competencyId],
          set: { sentence: e.sentence, authorId: current.id, aiAssisted: true },
        });
      await audit(current.id, "evidence.upsert", "skill_evidence", input.enrollmentId, { competencyId: e.competencyId, ai: true }, tx);
    }
    await audit(current.id, existing?.submittedAt ? "rating.edit" : "rating.submit", "weekly_ratings", rating.id, {
      week: input.week,
      levels: input.levels,
      noteAiAssisted: input.noteAiAssisted,
    }, tx);
  });

  if (input.aiEventId) await markAiAccepted(current.id, input.aiEventId, input.noteAiAssisted || input.evidence.length > 0);
  if (!existing?.submittedAt) {
    await notify(view.profile.userId, "ratingPosted", { preceptor: current.name, week: input.week, href: "/s/transcript" });
  }
  await evaluatePoolEligibility(input.enrollmentId, "rating", current.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** P6.5: approve a week of hours. */
export async function approveHours(entryId: string): Promise<ActionResult> {
  const current = await requireRole("preceptor");
  const [entry] = await db.select().from(hoursEntries).where(eq(hoursEntries.id, entryId)).limit(1);
  if (!entry) return { ok: false, error: "generic" };
  await assertCanEnrollment(current, "hours", "write", entry.enrollmentId);
  await db.update(hoursEntries).set({ approvedBy: current.id, approvedAt: new Date() }).where(eq(hoursEntries.id, entryId));
  await audit(current.id, "hours.approve", "hours_entries", entryId, { week: entry.week });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** P6.5: mark a work sample verified. */
export async function verifySample(sampleId: string): Promise<ActionResult> {
  const current = await requireRole("preceptor");
  const [sample] = await db.select().from(workSamples).where(eq(workSamples.id, sampleId)).limit(1);
  if (!sample) return { ok: false, error: "generic" };
  await assertCanEnrollment(current, "samples", "write", sample.enrollmentId);
  await db.update(workSamples).set({ status: "verified", verifiedBy: current.id, verifiedAt: new Date() }).where(eq(workSamples.id, sampleId));
  await audit(current.id, "sample.verify", "work_samples", sampleId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** P6.6: edit the evidence sentence for one skill (max 200 characters). */
export async function saveEvidence(enrollmentId: string, competencyId: string, sentence: string): Promise<ActionResult> {
  const current = await requireRole("preceptor");
  await assertCanEnrollment(current, "evidence", "write", enrollmentId);
  const text = sentence.trim();
  if (text.length > 200) return { ok: false, error: "tooLong" };
  if (!text) {
    await db.delete(skillEvidence).where(and(eq(skillEvidence.enrollmentId, enrollmentId), eq(skillEvidence.competencyId, competencyId)));
  } else {
    await db
      .insert(skillEvidence)
      .values({ enrollmentId, competencyId, sentence: text, authorId: current.id, aiAssisted: false })
      .onConflictDoUpdate({ target: [skillEvidence.enrollmentId, skillEvidence.competencyId], set: { sentence: text, authorId: current.id, aiAssisted: false } });
  }
  await audit(current.id, "evidence.edit", "skill_evidence", enrollmentId, { competencyId });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** P7.1: schedule a monthly meeting (sponsor). Times are in the program time zone. */
export async function scheduleMeeting(enrollmentId: string, date: string, time: string): Promise<ActionResult> {
  const current = await requireRole("sponsor");
  const [enr] = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1);
  if (!enr || enr.sponsorId !== current.id) throw new ForbiddenError();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "generic" };
  await db.insert(sponsorMeetings).values({ enrollmentId, sponsorId: current.id, scheduledAt: zonedTime(date, time, "America/Chicago") });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function completeMeeting(meetingId: string, summary: string): Promise<ActionResult> {
  const current = await requireRole("sponsor");
  const [m] = await db.select().from(sponsorMeetings).where(eq(sponsorMeetings.id, meetingId)).limit(1);
  if (!m || m.sponsorId !== current.id) throw new ForbiddenError();
  await db
    .update(sponsorMeetings)
    .set({ completedAt: new Date(), summary: summary.trim().slice(0, 600) || null })
    .where(eq(sponsorMeetings.id, meetingId));
  revalidatePath("/", "layout");
  return { ok: true };
}

const ReferenceInput = z.object({
  referenceId: z.string(),
  decision: z.enum(["confirm", "decline"]),
  quote: z.string().max(240).optional(),
  approveQuote: z.boolean().optional(),
});

/** P7.2: a referee confirms or declines, optionally with an approved quote (BR-7). */
export async function respondReference(raw: z.input<typeof ReferenceInput>): Promise<ActionResult> {
  const current = await requireRole("preceptor", "sponsor");
  const input = ReferenceInput.parse(raw);
  const [ref] = await db.select().from(references).where(eq(references.id, input.referenceId)).limit(1);
  if (!ref || ref.refereeUserId !== current.id) throw new ForbiddenError();
  const quote = input.quote?.trim() || null;
  await db
    .update(references)
    .set({
      status: input.decision === "confirm" ? "confirmed" : "declined",
      confirmedAt: input.decision === "confirm" ? new Date() : null,
      quote: input.decision === "confirm" ? quote : null,
      quoteApproved: input.decision === "confirm" && !!quote && !!input.approveQuote,
    })
    .where(eq(references.id, ref.id));
  await audit(current.id, `reference.${input.decision}`, "references", ref.id, { quote: !!quote });
  if (input.decision === "confirm") {
    const [owner] = await db
      .select({ userId: studentProfiles.userId })
      .from(enrollments)
      .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
      .where(eq(enrollments.id, ref.enrollmentId));
    if (owner) await notify(owner.userId, "referenceConfirmed", { name: current.name, href: "/s/people" });
    await evaluatePoolEligibility(ref.enrollmentId, "reference", current.id);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** A referee asks the student to confirm the details of a reference before confirming it. */
export async function requestReferenceDetails(referenceId: string): Promise<ActionResult> {
  const current = await requireRole("preceptor", "sponsor");
  const [ref] = await db.select().from(references).where(eq(references.id, referenceId)).limit(1);
  if (!ref || ref.refereeUserId !== current.id) throw new ForbiddenError();
  if (ref.status !== "asked") return { ok: false, error: "generic" };
  await db.update(references).set({ detailsRequestedAt: new Date(), detailsConfirmedAt: null }).where(eq(references.id, ref.id));
  await audit(current.id, "reference.details_request", "references", ref.id);
  const [owner] = await db
    .select({ userId: studentProfiles.userId })
    .from(enrollments)
    .innerJoin(studentProfiles, eq(studentProfiles.id, enrollments.studentId))
    .where(eq(enrollments.id, ref.enrollmentId));
  if (owner) await notify(owner.userId, "detailsRequest", { name: current.name, href: "/s/people" });
  revalidatePath("/", "layout");
  return { ok: true };
}
