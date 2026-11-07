"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { zonedTime } from "@/domain/time";
import { audit, notify } from "../audit";
import { db } from "../db";
import { studentProfiles, vendorInterest } from "../db/schema";
import { getProgram } from "../queries/enrollment";
import { getFirm, isVisibleToFirm } from "../queries/vendor";
import { requireRole } from "../session";

/** P10.3: a firm asks to interview a visible completer. One pending request per firm and student. */
export async function requestInterview(studentId: string): Promise<{ ok: boolean; error?: "notVisible" | "pending" }> {
  const current = await requireRole("vendor_recruiter");
  const id = z.string().min(1).parse(studentId);
  const firm = await getFirm(current);
  if (!firm || !(await isVisibleToFirm(id, firm))) return { ok: false, error: "notVisible" };
  const [pending] = await db
    .select({ id: vendorInterest.id })
    .from(vendorInterest)
    .where(and(eq(vendorInterest.vendorOrgId, firm.orgId), eq(vendorInterest.studentId, id), eq(vendorInterest.studentResponse, "pending")))
    .limit(1);
  if (pending) return { ok: false, error: "pending" };
  const [row] = await db
    .insert(vendorInterest)
    .values({ vendorOrgId: firm.orgId, studentId: id, requestedBy: current.id, requestedAt: new Date(), studentResponse: "pending" })
    .returning({ id: vendorInterest.id });
  await audit(current.id, "vendor_interest.request", "vendor_interest", row.id, { vendorOrgId: firm.orgId });
  const [student] = await db.select({ userId: studentProfiles.userId }).from(studentProfiles).where(eq(studentProfiles.id, id));
  if (student) await notify(student.userId, "vendorRequest", { vendor: firm.name, href: "/s/openings" });
  revalidatePath("/vendor", "layout");
  return { ok: true };
}

const InterviewUpdate = z.object({
  interestId: z.string().min(1),
  interviewAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .or(z.literal(""))
    .optional(),
  outcome: z.enum(["none", "offer", "no_offer"]).optional(),
});

/** P10.3: the firm records the interview date and outcome. Dates are program time (America/Chicago). */
export async function updateInterview(raw: z.input<typeof InterviewUpdate>): Promise<{ ok: boolean }> {
  const current = await requireRole("vendor_recruiter");
  const input = InterviewUpdate.parse(raw);
  const firm = await getFirm(current);
  if (!firm) return { ok: false };
  const [row] = await db
    .select()
    .from(vendorInterest)
    .where(and(eq(vendorInterest.id, input.interestId), eq(vendorInterest.vendorOrgId, firm.orgId)))
    .limit(1);
  if (!row || row.studentResponse !== "accepted") return { ok: false };
  const program = await getProgram();
  const set: Partial<typeof vendorInterest.$inferInsert> = {};
  if (input.interviewAt !== undefined) {
    set.interviewAt = input.interviewAt ? zonedTime(input.interviewAt.slice(0, 10), input.interviewAt.slice(11, 16), program.timeZone) : null;
  }
  if (input.outcome !== undefined) set.outcome = input.outcome;
  await db.update(vendorInterest).set(set).where(eq(vendorInterest.id, row.id));
  await audit(current.id, "vendor_interest.update", "vendor_interest", row.id, {
    interviewAt: set.interviewAt?.toISOString() ?? null,
    outcome: set.outcome ?? row.outcome,
  });
  revalidatePath("/vendor", "layout");
  return { ok: true };
}

/** P10.3: the student accepts or declines a vendor's interview request. */
export async function respondVendorRequest(interestId: string, accept: boolean): Promise<{ ok: boolean }> {
  const current = await requireRole("student");
  const id = z.string().min(1).parse(interestId);
  const [row] = await db
    .select({ id: vendorInterest.id, userId: studentProfiles.userId })
    .from(vendorInterest)
    .innerJoin(studentProfiles, eq(studentProfiles.id, vendorInterest.studentId))
    .where(eq(vendorInterest.id, id))
    .limit(1);
  if (!row || row.userId !== current.id) return { ok: false };
  await db
    .update(vendorInterest)
    .set({ studentResponse: accept ? "accepted" : "declined" })
    .where(eq(vendorInterest.id, row.id));
  await audit(current.id, accept ? "vendor_interest.accept" : "vendor_interest.decline", "vendor_interest", row.id);
  revalidatePath("/s", "layout");
  revalidatePath("/vendor", "layout");
  return { ok: true };
}
