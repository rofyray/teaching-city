"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { currentWeek } from "@/domain/rules";
import { zonedTime } from "@/domain/time";
import { audit, notify } from "../audit";
import { db } from "../db";
import {
  enrollments,
  jobClassifications,
  memberships,
  openingInvites,
  openings,
  organizations,
  poolEntries,
  studentProfiles,
  teachingUnits,
  user,
  vendorPledges,
} from "../db/schema";
import { evaluatePoolEligibility } from "../eligibility";
import { activeCohortFor } from "../queries/city";
import { getProgram } from "../queries/enrollment";
import { requireRole } from "../session";

export type CityResult = { ok: true; message?: string; data?: Record<string, string> } | { ok: false; error: string; data?: Record<string, string> };

const ConfirmInput = z.object({
  profileId: z.string().min(1),
  unitId: z.string().min(1),
  classificationId: z.string().min(1),
  preceptorId: z.string().min(1),
  sponsorId: z.string().min(1),
  reason: z.string().trim().min(1).max(400),
});

/** P4.4: the coordinator confirms a match. Capacity is enforced; suggestions never limit the choice. */
export async function confirmMatch(raw: z.input<typeof ConfirmInput>): Promise<CityResult> {
  const current = await requireRole("city_coordinator");
  const parsed = ConfirmInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "generic" };
  const input = parsed.data;

  const [profile] = await db
    .select({ profile: studentProfiles, name: user.name })
    .from(studentProfiles)
    .innerJoin(user, eq(user.id, studentProfiles.userId))
    .where(eq(studentProfiles.id, input.profileId))
    .limit(1);
  const [unit] = await db.select().from(teachingUnits).where(eq(teachingUnits.id, input.unitId)).limit(1);
  if (!profile || !unit) return { ok: false, error: "generic" };

  const staff = await db
    .select({ userId: memberships.userId, role: memberships.role, name: user.name })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(inArray(memberships.userId, [input.preceptorId, input.sponsorId]));
  const preceptor = staff.find((s) => s.userId === input.preceptorId && s.role === "preceptor");
  const sponsor = staff.find((s) => s.userId === input.sponsorId && s.role === "sponsor");
  if (!preceptor || !sponsor) return { ok: false, error: "generic" };

  const filled = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.unitId, unit.id), eq(enrollments.status, "active")));
  if (filled.length >= unit.capacity) return { ok: false, error: "full", data: { unit: unit.name } };

  const cohort = await activeCohortFor(profile.profile.collegeOrgId);
  if (!cohort) return { ok: false, error: "generic" };

  const existing = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.studentId, profile.profile.id), eq(enrollments.status, "proposed")))
    .limit(1);
  const values = {
    studentId: profile.profile.id,
    cohortId: cohort.id,
    unitId: unit.id,
    classificationId: input.classificationId,
    preceptorId: preceptor.userId,
    sponsorId: sponsor.userId,
    status: "active" as const,
    startDate: cohort.startDate,
    matchedBy: current.id,
    matchReason: input.reason,
  };
  let enrollmentId: string;
  if (existing[0]) {
    await db.update(enrollments).set(values).where(eq(enrollments.id, existing[0].id));
    enrollmentId = existing[0].id;
  } else {
    const [row] = await db.insert(enrollments).values(values).returning({ id: enrollments.id });
    enrollmentId = row.id;
  }
  await audit(current.id, "match.confirm", "enrollments", enrollmentId, { unitId: unit.id, preceptorId: preceptor.userId });
  await notify(profile.profile.userId, "matchConfirmed", { unit: unit.name, preceptor: preceptor.name, href: "/s" });
  await notify(preceptor.userId, "matchConfirmed", { unit: unit.name, preceptor: preceptor.name, href: "/m" });
  revalidatePath("/city", "layout");
  return { ok: true, data: { firstName: profile.name.split(" ")[0], preceptor: preceptor.name } };
}

/** P9.2: mark a rotation complete. Before the last week a reason is required. */
export async function completeRotation(enrollmentId: string, reason: string): Promise<CityResult> {
  const current = await requireRole("city_coordinator");
  const [enr] = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)).limit(1);
  if (!enr || enr.status !== "active") return { ok: false, error: "generic" };
  const program = await getProgram();
  const week = enr.startDate ? currentWeek(enr.startDate, new Date(), program.timeZone) : 0;
  const early = week < program.weeks;
  const why = reason.trim().slice(0, 400);
  if (early && !why) return { ok: false, error: "reason" };
  await db
    .update(enrollments)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(enrollments.id, enrollmentId));
  await audit(current.id, "enrollment.complete", "enrollments", enrollmentId, { week, early, reason: why || null });
  await evaluatePoolEligibility(enrollmentId, "completion", current.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

const PlainInput = z.object({
  classificationId: z.string().min(1),
  summary: z.string().trim().min(1).max(320),
  dayToDay: z.array(z.string().trim().min(1).max(120)).min(1).max(5),
  whatYouNeed: z.array(z.string().trim().min(1).max(120)).min(1).max(5),
});

/** P11.3: the coordinator approves an edited plain-language version for students. */
export async function approvePlainLanguage(raw: z.input<typeof PlainInput>): Promise<CityResult> {
  const current = await requireRole("city_coordinator");
  const parsed = PlainInput.safeParse({
    ...raw,
    dayToDay: raw.dayToDay.filter((x) => x.trim()),
    whatYouNeed: raw.whatYouNeed.filter((x) => x.trim()),
  });
  if (!parsed.success) return { ok: false, error: "generic" };
  const input = parsed.data;
  await db
    .update(jobClassifications)
    .set({
      plainSummary: { summary: input.summary, dayToDay: input.dayToDay, whatYouNeed: input.whatYouNeed },
      plainStatus: "approved",
      plainApprovedBy: current.id,
      plainApprovedAt: new Date(),
    })
    .where(eq(jobClassifications.id, input.classificationId));
  await audit(current.id, "classification.plain_approve", "job_classifications", input.classificationId);
  revalidatePath("/", "layout");
  return { ok: true };
}

const OpeningInput = z.object({
  title: z.string().trim().min(1).max(120),
  classificationId: z.string().min(1),
  department: z.string().trim().max(120),
});

/** P9.4: create an opening for a classification. */
export async function createOpening(raw: z.input<typeof OpeningInput>): Promise<CityResult> {
  const current = await requireRole("city_coordinator");
  const parsed = OpeningInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "generic" };
  const program = await getProgram();
  const [row] = await db
    .insert(openings)
    .values({
      programId: program.id,
      classificationId: parsed.data.classificationId,
      title: parsed.data.title,
      department: parsed.data.department || null,
      postedAt: new Date(),
      status: "open",
    })
    .returning({ id: openings.id });
  await audit(current.id, "opening.create", "openings", row.id);
  revalidatePath("/city/openings");
  return { ok: true };
}

/** P9.4: invite pool members to an opening. */
export async function inviteToOpening(openingId: string, poolEntryIds: string[]): Promise<CityResult> {
  const current = await requireRole("city_coordinator");
  if (poolEntryIds.length === 0) return { ok: false, error: "generic" };
  const [opening] = await db.select().from(openings).where(eq(openings.id, openingId)).limit(1);
  if (!opening) return { ok: false, error: "generic" };
  const entries = await db
    .select({ entry: poolEntries, userId: studentProfiles.userId })
    .from(poolEntries)
    .innerJoin(studentProfiles, eq(studentProfiles.id, poolEntries.studentId))
    .where(and(inArray(poolEntries.id, poolEntryIds), ne(poolEntries.status, "withdrawn")));
  for (const { entry, userId } of entries) {
    const [created] = await db
      .insert(openingInvites)
      .values({ openingId, poolEntryId: entry.id, invitedAt: new Date() })
      .onConflictDoNothing({ target: [openingInvites.openingId, openingInvites.poolEntryId] })
      .returning({ id: openingInvites.id });
    if (!created) continue;
    await audit(current.id, "invite.create", "opening_invites", created.id, { openingId, poolEntryId: entry.id });
    await notify(userId, "invited", { opening: opening.title, href: "/s/openings" });
  }
  revalidatePath("/city", "layout");
  return { ok: true };
}

const InviteUpdate = z.object({
  inviteId: z.string().min(1),
  field: z.enum(["interview", "offer", "accept", "decline"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** P9.4: record interview, offer, acceptance or decline on one invite. */
export async function updateInvite(raw: z.input<typeof InviteUpdate>): Promise<CityResult> {
  const current = await requireRole("city_coordinator");
  const parsed = InviteUpdate.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "generic" };
  const { inviteId, field, date } = parsed.data;
  const [invite] = await db.select().from(openingInvites).where(eq(openingInvites.id, inviteId)).limit(1);
  if (!invite) return { ok: false, error: "generic" };
  const program = await getProgram();
  const at = date ? zonedTime(date, field === "interview" ? "10:00" : "12:00", program.timeZone) : new Date();

  if (field === "interview") {
    await db.update(openingInvites).set({ interviewAt: at }).where(eq(openingInvites.id, inviteId));
  } else if (field === "offer") {
    await db.update(openingInvites).set({ offerAt: at }).where(eq(openingInvites.id, inviteId));
    await db.update(poolEntries).set({ status: "offered" }).where(eq(poolEntries.id, invite.poolEntryId));
  } else if (field === "accept") {
    if (!invite.offerAt) return { ok: false, error: "generic" };
    await db.update(openingInvites).set({ acceptedAt: at, declinedAt: null }).where(eq(openingInvites.id, inviteId));
    await db.update(poolEntries).set({ status: "hired" }).where(eq(poolEntries.id, invite.poolEntryId));
    await db.update(openings).set({ status: "filled" }).where(eq(openings.id, invite.openingId));
  } else {
    await db.update(openingInvites).set({ declinedAt: at, acceptedAt: null }).where(eq(openingInvites.id, inviteId));
    await db.update(poolEntries).set({ status: "active" }).where(eq(poolEntries.id, invite.poolEntryId));
  }
  await audit(current.id, `invite.${field}`, "opening_invites", inviteId, { date: date ?? null });
  revalidatePath("/", "layout");
  return { ok: true };
}

const PledgeInput = z.object({
  vendorName: z.string().trim().min(1).max(120),
  contactName: z.string().trim().min(1).max(120),
  rolesOffered: z.string().trim().min(1).max(240),
  pledgedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** P10.1: add a vendor organization and its pledge. */
export async function addPledge(raw: z.input<typeof PledgeInput>): Promise<CityResult> {
  const current = await requireRole("city_coordinator");
  const parsed = PledgeInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "generic" };
  const input = parsed.data;
  const program = await getProgram();
  const base = slugify(input.vendorName) || "vendor";
  const taken = await db.select({ slug: organizations.slug }).from(organizations);
  let slug = base;
  for (let i = 2; taken.some((t) => t.slug === slug); i++) slug = `${base}-${i}`;
  const [org] = await db
    .insert(organizations)
    .values({ type: "vendor", name: input.vendorName, slug, cityProgramId: program.id })
    .returning({ id: organizations.id });
  const [pledge] = await db
    .insert(vendorPledges)
    .values({
      vendorOrgId: org.id,
      programId: program.id,
      contactName: input.contactName,
      rolesOffered: input.rolesOffered,
      pledgedAt: zonedTime(input.pledgedAt, "09:00", program.timeZone),
    })
    .returning({ id: vendorPledges.id });
  await audit(current.id, "pledge.create", "vendor_pledges", pledge.id, { vendorOrgId: org.id });
  revalidatePath("/city/vendors");
  return { ok: true };
}

/** P10.1: ending a pledge hides every student from that vendor at once (BR-10). */
export async function endPledge(pledgeId: string): Promise<CityResult> {
  const current = await requireRole("city_coordinator");
  await db.update(vendorPledges).set({ endedAt: new Date() }).where(eq(vendorPledges.id, pledgeId));
  await audit(current.id, "pledge.end", "vendor_pledges", pledgeId);
  revalidatePath("/", "layout");
  return { ok: true };
}
