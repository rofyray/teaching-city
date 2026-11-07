/**
 * P11.5: runs 5 fixed inputs per AI feature against the configured model and checks schema
 * validity, word limits and the absence of em dashes. Needs AI_GATEWAY_API_KEY and AI_MODEL.
 * Usage: pnpm eval:ai
 */
import "./env";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import type * as z from "zod";
import { COURSE_MAPPING_SYSTEM, NOTE_DRAFT_SYSTEM, PLAIN_LANGUAGE_SYSTEM } from "../src/server/ai/prompts";
import { CourseMapping, NoteDraft, PlainClassification, wordCount } from "../src/server/ai/schemas";
import seedData from "../content/seed-data.json";

const EM_DASH = String.fromCharCode(0x2014);
const BA1 = seedData.units[0].classification;
const skills = (levels: number[]) =>
  BA1.competencies.map((c, i) => `${i + 1}. ${c} (this week: ${["", "Not yet", "Developing", "Meets standard", "Above standard"][levels[i]]})`).join("\n");

const noteCases = [
  "variance memo clear, sourced every number. next wk walk me thru one number before sending",
  "quiet in team mtg again. reconciled payroll for 3 depts, zero errors. built pivot table in budget workbook",
  "late on the parks summary by a day. good catch on duplicate vendor payment",
  "helped Jordan learn the GL codes, explained variance to Parks director in plain words",
  "first week. asked about chart of accounts. set up her workbook",
].map((notes, i) => ({ notes, levels: [3, 3, 4, i % 2 ? 2 : 3, 3] }));

const plainCases = seedData.units.slice(0, 5).map((u) => u.classification);

const courseCases = [
  ["Intermediate Accounting I", "Cost Accounting", "Business Statistics"],
  ["Data Structures", "Computer Networks"],
  ["Public Speaking", "News Writing", "Digital Marketing"],
  ["Statics", "Surveying", "Technical Writing"],
  ["Ceramics"],
];
const classificationList = seedData.units
  .map((u) => `${u.classification.code}: ${u.classification.title}. Skills: ${u.classification.competencies.join("; ")}`)
  .join("\n");

type Check = { name: string; ok: boolean; detail?: string };

async function run<T>(instructions: string, prompt: string, schema: z.ZodType<T>) {
  const model = process.env.AI_MODEL;
  if (!model) throw new Error("AI_MODEL is not set");
  const result = await generateText({
    model: gateway(model),
    instructions,
    prompt,
    output: Output.object({ schema }),
    abortSignal: AbortSignal.timeout(30_000),
  });
  return result.output as T;
}

function noDash(value: unknown) {
  return !JSON.stringify(value).includes(EM_DASH);
}

async function main() {
  const checks: Check[] = [];
  for (const [i, c] of noteCases.entries()) {
    const name = `note_draft #${i + 1}`;
    try {
      const out = await run(NOTE_DRAFT_SYSTEM, `Student first name: Amara\nWeek: 6\nSkills:\n${skills(c.levels)}\n\nSupervisor's notes:\n"""\n${c.notes}\n"""`, NoteDraft);
      const sentencesOk = out.evidence.every((e) => !e.sentence || wordCount(e.sentence) <= 25);
      const positionsOk = [1, 2, 3, 4, 5].every((p) => out.evidence.some((e) => e.competencyPosition === p));
      checks.push({ name, ok: wordCount(out.note) <= 60 && sentencesOk && positionsOk && noDash(out), detail: out.note });
    } catch (e) {
      checks.push({ name, ok: false, detail: String(e) });
    }
  }
  for (const [i, c] of plainCases.entries()) {
    const name = `plain_language #${i + 1} ${c.code}`;
    try {
      const out = await run(PLAIN_LANGUAGE_SYSTEM, `Title: ${c.title}\n\nOfficial description:\n"""\n${c.raw}\n"""`, PlainClassification);
      checks.push({ name, ok: wordCount(out.summary) <= 50 && noDash(out), detail: out.summary });
    } catch (e) {
      checks.push({ name, ok: false, detail: String(e) });
    }
  }
  for (const [i, courses] of courseCases.entries()) {
    const name = `course_mapping #${i + 1}`;
    try {
      const out = await run(
        COURSE_MAPPING_SYSTEM,
        `Classifications:\n${classificationList}\n\nStudent's courses:\n${courses.map((c) => `- ${c}`).join("\n")}`,
        CourseMapping,
      );
      const codes = new Set(seedData.units.map((u) => u.classification.code));
      const ok = out.matches.every((m) => codes.has(m.classificationCode) && wordCount(m.reason) <= 20 && m.courses.every((c) => courses.includes(c)));
      checks.push({ name, ok: ok && noDash(out), detail: out.matches.map((m) => m.classificationCode).join(", ") || "no matches" });
    } catch (e) {
      checks.push({ name, ok: false, detail: String(e) });
    }
  }
  for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}  ${c.detail ?? ""}`);
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`${checks.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
