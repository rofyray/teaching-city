import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { shareLinkUsable, vendorVisible } from "@/domain/rules";
import { activePledgeFor, actorFrom, consentState, loadStudentContext } from "@/server/authz";
import { db } from "@/server/db";
import { enrollments, sampleFiles, shareLinks, workSamples } from "@/server/db/schema";
import { SAMPLE_TYPES } from "@/server/files";
import { decide } from "@/server/permissions";
import { getCurrentUser } from "@/server/session";
import { hashToken } from "@/server/tokens";

/** Serves work samples only after a permission check. Raw blob URLs never reach the browser. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sample] = await db
    .select({ sample: workSamples, studentId: enrollments.studentId, enrollmentStatus: enrollments.status })
    .from(workSamples)
    .innerJoin(enrollments, eq(enrollments.id, workSamples.enrollmentId))
    .where(eq(workSamples.id, id))
    .limit(1);
  if (!sample) return new NextResponse("Not found", { status: 404 });

  let allowed = false;
  const token = request.nextUrl.searchParams.get("t");
  if (token) {
    const [link] = await db.select().from(shareLinks).where(eq(shareLinks.tokenHash, hashToken(token))).limit(1);
    const consent = await consentState(sample.studentId);
    allowed =
      !!link &&
      link.studentId === sample.studentId &&
      shareLinkUsable(link, new Date()) &&
      consent.public_link &&
      sample.sample.status === "verified";
  } else {
    const current = await getCurrentUser();
    if (current) {
      const actor = actorFrom(current);
      const ctx = await loadStudentContext(sample.studentId, actor);
      if (ctx) {
        const vendorOnly = actor.roles.length > 0 && actor.roles.every((r) => r === "vendor_recruiter");
        if (vendorOnly) {
          const consent = await consentState(sample.studentId);
          allowed =
            sample.sample.status === "verified" &&
            vendorVisible({
              shareVendorBridge: consent.share_vendor_bridge,
              pledgeActive: await activePledgeFor(actor.vendorOrgIds),
              enrollmentStatus: sample.enrollmentStatus,
            });
        } else {
          allowed = decide(actor, "samples", "read", ctx);
        }
      }
    }
  }
  if (!allowed) return new NextResponse("Not found", { status: 404 });

  const ext = SAMPLE_TYPES[sample.sample.mimeType] ?? "bin";
  const filename = `${sample.sample.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${ext}`;
  const headers = {
    "Content-Type": sample.sample.mimeType,
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };

  const [stored] = await db.select().from(sampleFiles).where(eq(sampleFiles.sampleId, id)).limit(1);
  if (stored) return new NextResponse(Buffer.from(stored.contentBase64, "base64"), { headers });

  if (sample.sample.blobPathname) {
    const result = await get(sample.sample.blobPathname, { access: "private" });
    if (result?.stream) return new NextResponse(result.stream, { headers });
  }
  return new NextResponse("Not found", { status: 404 });
}
