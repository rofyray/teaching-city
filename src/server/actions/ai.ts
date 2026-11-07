"use server";

import { asc, eq } from "drizzle-orm";
import { AiError, markAiAccepted, runAi } from "../ai/client";
import { COURSE_MAPPING_SYSTEM, NOTE_DRAFT_SYSTEM, PLAIN_LANGUAGE_SYSTEM } from "../ai/prompts";
import { CourseMapping, NoteDraft, PlainClassification } from "../ai/schemas";
import { audit } from "../audit";
import { assertCanEnrollment } from "../authz";
import { db } from "../db";
import { competencies, jobClassifications } from "../db/schema";
import { getEnrollmentView } from "../queries/enrollment";
import { getCurrentUser, requireRole } from "../session";

type Failure = { ok: false; error: "needNotes" | "unavailable" | "limit" };

function failure(error: unknown): Failure {
  if (error instanceof AiError && error.code === "limit") return { ok: false, error: "limit" };
  return { ok: false, error: "unavailable" };
}

/** 8.1 Draft from my notes. Sends only notes, first name, week, skill labels and selected levels. */
export async function draftNote(input: {
  enrollmentId: string;
  week: number;
  notes: string;
  levels: Record<number, number | undefined>;
}): Promise<{ ok: true; eventId: string; draft: NoteDraft } | Failure> {
  const current = await requireRole("preceptor");
  await assertCanEnrollment(current, "ratings", "write", input.enrollmentId);
  const notes = input.notes.trim();
  if (notes.length < 10 || notes.length > 1000) return { ok: false, error: "needNotes" };
  const view = await getEnrollmentView(input.enrollmentId);
  if (!view) return { ok: false, error: "unavailable" };
  const levelNames = ["", "Not yet", "Developing", "Meets standard", "Above standard"];
  const skills = view.competencies
    .map((c) => `${c.position}. ${c.label} (this week: ${levelNames[input.levels[c.position] ?? 0] || "not selected"})`)
    .join("\n");
  const prompt = `Student first name: ${view.student.firstName}\nWeek: ${input.week}\nSkills:\n${skills}\n\nSupervisor's notes:\n"""\n${notes}\n"""`;
  try {
    const { eventId, output } = await runAi({
      userId: current.id,
      feature: "note_draft",
      instructions: NOTE_DRAFT_SYSTEM,
      prompt,
      schema: NoteDraft,
    });
    return { ok: true, eventId, draft: output };
  } catch (error) {
    return failure(error);
  }
}

export async function recordAiDecision(eventId: string, accepted: boolean) {
  const current = await getCurrentUser();
  if (!current) return;
  await markAiAccepted(current.id, eventId, accepted);
}

/** 8.2 Plain-language classification. Sends only the title and official description. */
export async function draftPlainLanguage(classificationId: string): Promise<{ ok: true; eventId: string; draft: PlainClassification } | Failure> {
  const current = await requireRole("city_coordinator");
  const [cls] = await db.select().from(jobClassifications).where(eq(jobClassifications.id, classificationId)).limit(1);
  if (!cls) return { ok: false, error: "unavailable" };
  try {
    const { eventId, output } = await runAi({
      userId: current.id,
      feature: "plain_language",
      instructions: PLAIN_LANGUAGE_SYSTEM,
      prompt: `Title: ${cls.title}\n\nOfficial description:\n"""\n${cls.rawDescription}\n"""`,
      schema: PlainClassification,
    });
    await db
      .update(jobClassifications)
      .set({ plainSummary: output, plainStatus: "draft", plainApprovedBy: null, plainApprovedAt: null })
      .where(eq(jobClassifications.id, classificationId));
    await audit(current.id, "classification.plain_draft", "job_classifications", classificationId);
    return { ok: true, eventId, draft: output };
  } catch (error) {
    return failure(error);
  }
}

/** 8.3 Course mapping. Sends only course titles and the classification list with skills. */
export async function mapCourses(courses: string[]): Promise<{ ok: true; eventId: string; mapping: CourseMapping } | Failure> {
  const current = await requireRole("student");
  const clean = courses.map((c) => c.trim().slice(0, 80)).filter(Boolean).slice(0, 20);
  if (clean.length === 0) return { ok: false, error: "needNotes" };
  const classes = await db.select().from(jobClassifications).orderBy(asc(jobClassifications.code));
  const comps = await db.select().from(competencies).orderBy(asc(competencies.position));
  const list = classes
    .map((c) => `${c.code}: ${c.title}. Skills: ${comps.filter((x) => x.classificationId === c.id).map((x) => x.label).join("; ")}`)
    .join("\n");
  try {
    const { eventId, output } = await runAi({
      userId: current.id,
      feature: "course_mapping",
      instructions: COURSE_MAPPING_SYSTEM,
      prompt: `Classifications:\n${list}\n\nStudent's courses:\n${clean.map((c) => `- ${c}`).join("\n")}`,
      schema: CourseMapping,
    });
    const codes = new Set(classes.map((c) => c.code));
    const mapping = {
      matches: output.matches
        .filter((m) => codes.has(m.classificationCode))
        .map((m) => ({ ...m, courses: m.courses.filter((c) => clean.includes(c)) })),
    };
    return { ok: true, eventId, mapping };
  } catch (error) {
    return failure(error);
  }
}


