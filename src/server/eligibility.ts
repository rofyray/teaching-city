import "server-only";
import { and, eq } from "drizzle-orm";
import { poolEligibility } from "@/domain/rules";
import { audit, notify } from "./audit";
import { db } from "./db";
import { poolEntries, studentProfiles } from "./db/schema";
import { getEnrollmentView } from "./queries/enrollment";

export type EligibilityTrigger = "rating" | "reference" | "consent" | "completion" | "sweep";

/**
 * BR-8: create or withdraw the pool entry for an enrollment. Safe to call repeatedly.
 * Entering is automatic; leaving happens here only when the student turned off City HR sharing.
 */
export async function evaluatePoolEligibility(enrollmentId: string, trigger: EligibilityTrigger, actorId: string | null = null) {
  const view = await getEnrollmentView(enrollmentId);
  if (!view) return { changed: false as const, eligible: false };
  const result = poolEligibility({
    enrollmentStatus: view.enrollment.status,
    latest: view.derived.latest,
    competencyIds: view.competencies.map((c) => c.id),
    confirmedRefs: view.derived.confirmed,
    referencesRequired: view.program.referencesRequired,
    shareCityHr: view.consent.share_city_hr,
  });
  const entry = view.poolEntry;

  if (result.eligible && (!entry || entry.status === "withdrawn")) {
    const now = new Date();
    if (entry) {
      await db.update(poolEntries).set({ status: "active", enteredAt: now, withdrawReason: null }).where(eq(poolEntries.id, entry.id));
    } else {
      await db
        .insert(poolEntries)
        .values({
          studentId: view.profile.id,
          enrollmentId,
          classificationId: view.enrollment.classificationId,
          enteredAt: now,
          status: "active",
        })
        .onConflictDoNothing({ target: poolEntries.enrollmentId });
    }
    await audit(actorId, "pool.enter", "pool_entries", enrollmentId, { trigger });
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, view.profile.id));
    await notify(profile.userId, "poolEntered", { classification: view.classification?.title ?? "", href: "/s/openings" });
    return { changed: true as const, eligible: true };
  }

  if (!result.eligible && entry && entry.status === "active" && result.missing.consent) {
    await db
      .update(poolEntries)
      .set({ status: "withdrawn", withdrawReason: "share_city_hr off" })
      .where(and(eq(poolEntries.id, entry.id), eq(poolEntries.status, "active")));
    await audit(actorId, "pool.withdraw", "pool_entries", enrollmentId, { trigger, reason: "share_city_hr off" });
    return { changed: true as const, eligible: false };
  }

  return { changed: false as const, eligible: result.eligible };
}
