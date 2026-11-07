"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { validateHours, windowHours } from "@/domain/rules";
import { audit, notify } from "../audit";
import { isDemoMode } from "../auth";
import { db } from "../db";
import {
  consents,
  hoursEntries,
  memberships,
  references,
  sampleFiles,
  studentProfiles,
  user,
  workSamples,
  type ScheduleWindow,
} from "../db/schema";
import { maxUploadBytes, SAMPLE_TYPES } from "../files";
import { getEnrollmentView, getStudentProfileByUser, primaryEnrollmentId } from "../queries/enrollment";
import { CONSENT_VERSION } from "../seed";
import { requireRole } from "../session";

type Result = { ok: true } | { ok: false; error: string };

async function studentView() {
  const current = await requireRole("student");
  const profile = await getStudentProfileByUser(current.id);
  if (!profile) throw new Error("No profile");
  const enrollmentId = await primaryEnrollmentId(profile.id);
  const view = enrollmentId ? await getEnrollmentView(enrollmentId) : null;
  return { current, profile, view };
}

/** P5.3: log hours for a week, editable until the preceptor approves (BR-2). */
export async function saveHours(week: number, hoursInput: string, note: string): Promise<Result> {
  const { current, view } = await studentView();
  if (!view || view.enrollment.status !== "active") return { ok: false, error: "generic" };
  if (!Number.isInteger(week) || week < 1 || week > Math.min(view.derived.rawWeek, view.program.weeks)) return { ok: false, error: "generic" };
  const parsed = validateHours(hoursInput, view.program.maxHours);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (Math.round(parsed.hours * 2) !== parsed.hours * 2) return { ok: false, error: "notNumber" };
  const existing = view.hours.find((h) => h.week === week);
  if (existing?.approvedAt) return { ok: false, error: "generic" };
  const values = { enrollmentId: view.enrollment.id, week, hours: parsed.hours, note: note.trim().slice(0, 300) || null, submittedAt: new Date() };
  await db
    .insert(hoursEntries)
    .values(values)
    .onConflictDoUpdate({ target: [hoursEntries.enrollmentId, hoursEntries.week], set: values });
  await audit(current.id, "hours.save", "hours_entries", view.enrollment.id, { week, hours: parsed.hours });
  revalidatePath("/s", "layout");
  return { ok: true };
}

/** City staff a student may ask for a reference: their preceptor, sponsor, or a director-level sponsor. */
export async function eligibleReferees() {
  const { view } = await studentView();
  if (!view) return [];
  const sponsors = await db
    .select({ id: user.id, name: user.name, title: memberships.title })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(eq(memberships.role, "sponsor"));
  const ids = new Set<string>();
  const out: { id: string; name: string; title: string | null; relation: "preceptor" | "sponsor" | "other" }[] = [];
  const add = (p: { id: string; name: string; title: string | null }, relation: "preceptor" | "sponsor" | "other") => {
    if (ids.has(p.id) || view.references.some((r) => r.refereeUserId === p.id)) return;
    ids.add(p.id);
    out.push({ ...p, relation });
  };
  if (view.preceptor) {
    const [m] = await db.select({ title: memberships.title }).from(memberships).where(and(eq(memberships.userId, view.preceptor.id), eq(memberships.role, "preceptor")));
    add({ ...view.preceptor, title: m?.title ?? null }, "preceptor");
  }
  for (const s of sponsors) add(s, s.id === view.sponsor?.id ? "sponsor" : "other");
  return out;
}

/** P5.5: ask eligible city staff for a reference. */
export async function askReference(refereeUserId: string): Promise<Result> {
  const { current, view } = await studentView();
  if (!view) return { ok: false, error: "generic" };
  const eligible = await eligibleReferees();
  const referee = eligible.find((r) => r.id === refereeUserId);
  if (!referee) return { ok: false, error: "generic" };
  const [ref] = await db
    .insert(references)
    .values({
      enrollmentId: view.enrollment.id,
      refereeUserId: referee.id,
      refereeName: referee.name,
      refereeTitle: referee.title,
      relation: referee.relation,
      status: "asked",
      askedAt: new Date(),
    })
    .returning({ id: references.id });
  await audit(current.id, "reference.ask", "references", ref.id);
  await notify(referee.id, "referenceRequest", { firstName: current.firstName, href: "/m/references" });
  revalidatePath("/s", "layout");
  return { ok: true };
}

/** P7.3: hide or show an approved quote on the student's own transcript. */
export async function setQuoteHidden(referenceId: string, hidden: boolean): Promise<Result> {
  const { current, view } = await studentView();
  if (!view || !view.references.some((r) => r.id === referenceId)) return { ok: false, error: "generic" };
  await db.update(references).set({ quoteHiddenByStudent: hidden }).where(eq(references.id, referenceId));
  await audit(current.id, hidden ? "reference.quote_hide" : "reference.quote_show", "references", referenceId);
  revalidatePath("/s", "layout");
  return { ok: true };
}

const SampleMeta = z.object({
  week: z.number().int().min(1).max(15),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(160),
});

/** Records a sample after a client upload to private Vercel Blob storage. */
export async function recordBlobSample(input: z.input<typeof SampleMeta> & { pathname: string; url: string; contentType: string; size: number }): Promise<Result> {
  const { current, view } = await studentView();
  if (!view) return { ok: false, error: "generic" };
  const meta = SampleMeta.parse(input);
  if (!input.pathname.startsWith(`samples/${view.enrollment.id}/`)) return { ok: false, error: "generic" };
  if (!SAMPLE_TYPES[input.contentType]) return { ok: false, error: "wrongType" };
  if (input.size > maxUploadBytes()) return { ok: false, error: "tooBig" };
  const [sample] = await db
    .insert(workSamples)
    .values({
      enrollmentId: view.enrollment.id,
      week: meta.week,
      title: meta.title,
      description: meta.description || null,
      blobUrl: input.url,
      blobPathname: input.pathname,
      mimeType: input.contentType,
      sizeBytes: input.size,
      status: "draft",
    })
    .returning({ id: workSamples.id });
  await audit(current.id, "sample.upload", "work_samples", sample.id);
  revalidatePath("/s", "layout");
  return { ok: true };
}

/** Fallback upload when Blob storage is not configured: the file is kept in the database. */
export async function uploadSampleDirect(formData: FormData): Promise<Result> {
  const { current, view } = await studentView();
  if (!view) return { ok: false, error: "generic" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "uploadFailed" };
  if (!SAMPLE_TYPES[file.type]) return { ok: false, error: "wrongType" };
  if (file.size > Math.min(maxUploadBytes(), 4 * 1024 * 1024)) return { ok: false, error: "tooBig" };
  const meta = SampleMeta.safeParse({
    week: Number(formData.get("week")),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  if (!meta.success) return { ok: false, error: "generic" };
  const content = Buffer.from(await file.arrayBuffer()).toString("base64");
  await db.transaction(async (tx) => {
    const [sample] = await tx
      .insert(workSamples)
      .values({
        enrollmentId: view.enrollment.id,
        week: meta.data.week,
        title: meta.data.title,
        description: meta.data.description || null,
        mimeType: file.type,
        sizeBytes: file.size,
        status: "draft",
      })
      .returning({ id: workSamples.id });
    await tx.insert(sampleFiles).values({ sampleId: sample.id, contentBase64: content });
    await audit(current.id, "sample.upload", "work_samples", sample.id, {}, tx);
  });
  revalidatePath("/s", "layout");
  return { ok: true };
}

export async function demoUploadLimitMb() {
  return isDemoMode() ? 2 : 10;
}

const Onboarding = z.object({
  participation: z.literal(true),
  cityHr: z.literal(true),
  major: z.string().trim().min(1).max(120),
  majorCategory: z.enum([
    "accounting_finance",
    "business",
    "computer_science_it",
    "communications_marketing",
    "engineering",
    "economics_data_math",
    "social_sciences_psychology",
    "criminal_justice",
    "humanities_arts",
    "other",
  ]),
  classYear: z.enum(["junior", "senior", "community_college", "adult_learner"]),
  availability: z.array(z.object({ day: z.number().int().min(1).max(5), start: z.string(), end: z.string() })),
  courses: z.array(z.string().trim().min(1).max(80)).max(20),
  demographics: z
    .object({
      consent: z.boolean(),
      firstGen: z.boolean(),
      pell: z.boolean(),
      adultLearner: z.boolean(),
      veteran: z.boolean(),
    })
    .nullable(),
  courseMapping: z.array(z.object({ classificationCode: z.string(), reason: z.string().max(140), courses: z.array(z.string()).max(5) })).max(3).nullable(),
});

/** P4.1: finish onboarding. Both required consents must be granted (Section 7.3). */
export async function finishOnboarding(raw: z.input<typeof Onboarding>): Promise<Result> {
  const current = await requireRole("student");
  const parsed = Onboarding.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "consentRequired" };
  const input = parsed.data;
  if (windowHours(input.availability as ScheduleWindow[]) < 10) return { ok: false, error: "availabilityTooFew" };
  const profile = await getStudentProfileByUser(current.id);
  if (!profile) return { ok: false, error: "generic" };
  const now = new Date();
  const demo = input.demographics?.consent ? input.demographics : null;
  await db.transaction(async (tx) => {
    await tx
      .update(studentProfiles)
      .set({
        major: input.major,
        majorCategory: input.majorCategory,
        classYear: input.classYear,
        availability: input.availability,
        courses: input.courses,
        firstGen: demo ? demo.firstGen : null,
        pell: demo ? demo.pell : null,
        adultLearner: demo ? demo.adultLearner : null,
        veteran: demo ? demo.veteran : null,
        courseMapping: input.courseMapping,
        preferredLanguage: current.locale,
        onboardedAt: now,
      })
      .where(eq(studentProfiles.id, profile.id));
    const consentRows = [
      ["program_participation", true],
      ["share_city_hr", true],
      ["share_vendor_bridge", false],
      ["public_link", false],
      ["demographic_reporting", !!demo],
    ] as const;
    await tx.insert(consents).values(
      consentRows.map(([type, granted]) => ({
        studentId: profile.id,
        type,
        granted,
        version: CONSENT_VERSION,
        grantedAt: granted ? now : null,
        revokedAt: granted ? null : now,
      })),
    );
    await audit(current.id, "onboarding.finish", "student_profiles", profile.id, { consents: consentRows.filter(([, g]) => g).map(([t]) => t) }, tx);
  });
  revalidatePath("/s", "layout");
  return { ok: true };
}
