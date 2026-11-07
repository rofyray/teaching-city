import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/action-button";
import { PrintButton } from "@/components/print-button";
import { Transcript } from "@/components/transcript";
import { formatHours } from "@/domain/rules";
import { approveHours, verifySample } from "@/server/actions/mentor";
import { can } from "@/server/authz";
import { getEnrollmentView } from "@/server/queries/enrollment";
import { requireRole } from "@/server/session";
import { EvidenceEditor } from "./evidence-editor";

type Params = { enrollmentId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { enrollmentId } = await params;
  const view = await getEnrollmentView(enrollmentId);
  const t = await getTranslations("transcript");
  return { title: view ? `${view.student.name}, ${t("title")}` : t("title") };
}

export default async function MentorStudentPage({ params }: { params: Promise<Params> }) {
  const { enrollmentId } = await params;
  const current = await requireRole("preceptor", "sponsor");
  const view = await getEnrollmentView(enrollmentId);
  if (!view || !(await can(current, "ratings", "read", view.profile.id))) notFound();
  const t = await getTranslations();
  const isPreceptor = view.enrollment.preceptorId === current.id && current.roles.includes("preceptor");
  const rated = new Set(view.ratings.filter((r) => r.submittedAt).map((r) => r.week));
  const nextWeek = view.derived.rawWeek >= 1 && !rated.has(view.derived.week) ? view.derived.week : null;

  return (
    <>
      <Transcript
        view={view}
        variant="mentor"
        headerActions={<PrintButton label={t("transcript.print")} />}
        belowHeader={
          isPreceptor && nextWeek && view.enrollment.status === "active" ? (
            <div className="no-print mx-auto w-full max-w-[1280px] px-4 pt-4 lg:px-10">
              <Link
                href={`/m/rate/${enrollmentId}/${nextWeek}`}
                className="inline-flex min-h-[48px] items-center rounded-[8px] bg-ink px-4 text-body font-extrabold text-white no-underline"
              >
                {t("mentor.rateNow", { week: nextWeek })}
              </Link>
            </div>
          ) : null
        }
        sampleActions={
          isPreceptor
            ? (sampleId, status) =>
                status === "draft" ? <ActionButton action={verifySample.bind(null, sampleId)} label={t("mentor.verifySample")} successMessage={t("common.saved")} /> : null
            : undefined
        }
      />
      {isPreceptor ? (
        <div className="no-print mx-auto grid w-full max-w-[1280px] gap-6 px-4 pb-8 lg:grid-cols-2 lg:px-10">
          <section aria-labelledby="m-hours" className="card p-5">
            <h2 id="m-hours" className="text-title font-extrabold">
              {t("hours.title")}
            </h2>
            <ul className="mt-3">
              {view.hours.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-3 border-t border-rule py-3">
                  <span className="flex-1 text-body font-bold">{t("hours.weekLabel", { week: h.week })}</span>
                  <span className="tabular text-body font-extrabold">{t("common.hoursOf", { hours: formatHours(Number(h.hours)), max: view.program.maxHours })}</span>
                  {h.approvedAt ? (
                    <span className="text-caption font-bold text-muted">{t("hours.approved", { name: current.name })}</span>
                  ) : (
                    <ActionButton action={approveHours.bind(null, h.id)} label={t("mentor.approveHours")} successMessage={t("common.saved")} />
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="m-evidence" className="card p-5">
            <h2 id="m-evidence" className="mb-3 text-title font-extrabold">
              {t("mentor.editEvidence")}
            </h2>
            <EvidenceEditor
              enrollmentId={enrollmentId}
              firstName={view.student.firstName}
              rows={view.competencies.map((c) => ({
                competencyId: c.id,
                label: c.label,
                sentence: view.evidence.find((e) => e.competencyId === c.id)?.sentence ?? "",
              }))}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
