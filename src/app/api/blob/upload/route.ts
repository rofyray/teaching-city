import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getEnrollmentView, getStudentProfileByUser, primaryEnrollmentId } from "@/server/queries/enrollment";
import { maxUploadBytes, SAMPLE_TYPES } from "@/server/files";
import { getCurrentUser } from "@/server/session";

/** Issues client upload tokens for work samples (private Blob storage, P5.4). */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const current = await getCurrentUser();
        if (!current?.roles.includes("student")) throw new Error("Not allowed");
        const profile = await getStudentProfileByUser(current.id);
        const enrollmentId = profile ? await primaryEnrollmentId(profile.id) : null;
        const view = enrollmentId ? await getEnrollmentView(enrollmentId) : null;
        if (!view || !pathname.startsWith(`samples/${view.enrollment.id}/`)) throw new Error("Not allowed");
        return {
          allowedContentTypes: Object.keys(SAMPLE_TYPES),
          maximumSizeInBytes: maxUploadBytes(),
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // The sample row is written by the recordBlobSample Server Action after the upload resolves.
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Upload not allowed" }, { status: 400 });
  }
}
