"use server";

import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DEMO_SHARE_LINK_HOURS, SHARE_LINK_DAYS } from "@/domain/rules";
import { audit } from "../audit";
import { isDemoMode } from "../auth";
import { db } from "../db";
import { consents, enrollments, shareLinks } from "../db/schema";
import { evaluatePoolEligibility } from "../eligibility";
import { getStudentProfileByUser } from "../queries/enrollment";
import { CONSENT_VERSION } from "../seed";
import { requireRole } from "../session";
import { hashToken } from "../tokens";

type ShareType = "share_city_hr" | "share_vendor_bridge" | "public_link";

export async function setSharing(type: ShareType, granted: boolean): Promise<{ ok: true; url?: string } | { ok: false }> {
  const current = await requireRole("student");
  const profile = await getStudentProfileByUser(current.id);
  if (!profile) return { ok: false };
  const now = new Date();
  await db.insert(consents).values({
    studentId: profile.id,
    type,
    granted,
    version: CONSENT_VERSION,
    grantedAt: granted ? now : null,
    revokedAt: granted ? null : now,
  });
  await audit(current.id, granted ? "consent.grant" : "consent.revoke", "consents", profile.id, { type });

  let url: string | undefined;
  if (type === "public_link") {
    await db
      .update(shareLinks)
      .set({ revokedAt: now })
      .where(and(eq(shareLinks.studentId, profile.id), isNull(shareLinks.revokedAt)));
    if (granted) {
      const token = randomBytes(32).toString("base64url");
      const ms = isDemoMode() ? DEMO_SHARE_LINK_HOURS * 3_600_000 : SHARE_LINK_DAYS * 86_400_000;
      const [link] = await db
        .insert(shareLinks)
        .values({ studentId: profile.id, tokenHash: hashToken(token), expiresAt: new Date(now.getTime() + ms) })
        .returning({ id: shareLinks.id });
      await audit(current.id, "share_link.create", "share_links", link.id);
      url = `/t/${token}`;
    } else {
      await audit(current.id, "share_link.revoke", "share_links", profile.id);
    }
  }

  if (type === "share_city_hr") {
    const rows = await db.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.studentId, profile.id));
    for (const row of rows) await evaluatePoolEligibility(row.id, "consent", current.id);
  }

  revalidatePath("/s", "layout");
  return { ok: true, url };
}
