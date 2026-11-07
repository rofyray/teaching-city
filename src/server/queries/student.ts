import "server-only";
import { notFound } from "next/navigation";
import { requireRole } from "../session";
import { getEnrollmentView, getStudentProfileByUser, primaryEnrollmentId } from "./enrollment";

/** The signed-in student with their profile and primary enrollment view (null before a match). */
export async function getStudentArea() {
  const current = await requireRole("student");
  const profile = await getStudentProfileByUser(current.id);
  if (!profile) notFound();
  const enrollmentId = await primaryEnrollmentId(profile.id);
  const view = enrollmentId ? await getEnrollmentView(enrollmentId) : null;
  return { current, profile, view };
}
