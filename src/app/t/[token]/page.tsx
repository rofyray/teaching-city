import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Transcript } from "@/components/transcript";
import { shareLinkUsable } from "@/domain/rules";
import { consentState } from "@/server/authz";
import { db } from "@/server/db";
import { shareLinks } from "@/server/db/schema";
import { getEnrollmentView, primaryEnrollmentId } from "@/server/queries/enrollment";
import { hashToken } from "@/server/tokens";

type Params = { token: string };

/** BR-11: a valid, unexpired, unrevoked link whose owner still has the public link turned on. */
const loadShared = cache(async (token: string) => {
  if (!token || token.length > 200) return null;
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.tokenHash, hashToken(token)))
    .orderBy(desc(shareLinks.createdAt))
    .limit(1);
  if (!link || !shareLinkUsable(link, new Date())) return null;
  if (!(await consentState(link.studentId)).public_link) return null;
  const enrollmentId = await primaryEnrollmentId(link.studentId);
  const view = enrollmentId ? await getEnrollmentView(enrollmentId) : null;
  return view;
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("transcript");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function SharedTranscriptPage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  const view = await loadShared(decodeURIComponent(token));
  if (!view) notFound();
  const t = await getTranslations("transcript");
  return (
    <main id="main" className="flex flex-1 flex-col">
      <Transcript
        view={view}
        variant="public"
        shareToken={token}
        belowHeader={
          <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-5 lg:px-10">
            <p role="note" className="card p-4 text-body-sm font-semibold outline-rule">
              {t("sharedBy", { firstName: view.student.firstName })}
            </p>
          </div>
        }
      />
    </main>
  );
}
