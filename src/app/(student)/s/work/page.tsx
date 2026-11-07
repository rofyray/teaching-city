import { FileTextIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { WorkSampleCard } from "@/components/work-sample-card";
import { blobConfigured, maxUploadMb } from "@/server/files";
import { getStudentArea } from "@/server/queries/student";
import { UploadForm } from "./upload-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("work");
  return { title: t("title") };
}

export default async function WorkPage() {
  const { current, view } = await getStudentArea();
  const t = await getTranslations();
  if (!view || view.enrollment.status === "proposed") {
    return (
      <>
        <PageHeader title={t("work.title")} current={current} settingsHref="/s/settings" />
        <div className="mx-auto w-full max-w-[1280px] p-5 lg:px-10">
          <EmptyState icon={FileTextIcon} title={t("home.notMatchedTitle")} body={t("home.notMatchedBody")} />
        </div>
      </>
    );
  }
  const lastWeek = Math.min(Math.max(view.derived.rawWeek, 1), view.program.weeks);
  const weeks = Array.from({ length: lastWeek }, (_, i) => lastWeek - i);
  return (
    <>
      <PageHeader title={t("work.title")} current={current} settingsHref="/s/settings" />
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-6 px-5 py-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:px-10 lg:py-8">
        {view.enrollment.status === "active" ? (
          <section aria-labelledby="add" className="card p-5">
            <h2 id="add" className="mb-3 text-subheading font-extrabold">
              {t("work.add")}
            </h2>
            <UploadForm enrollmentId={view.enrollment.id} weeks={weeks} defaultWeek={lastWeek} maxMb={maxUploadMb()} useBlob={blobConfigured()} />
          </section>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {view.samples.map((s) => (
            <WorkSampleCard
              key={s.id}
              title={s.title}
              meta={[s.description, t("transcript.week", { week: s.week }).toLowerCase()].filter(Boolean).join(", ")}
              href={`/api/files/${s.id}`}
              linkLabel={t("work.openSample")}
              status={
                s.status === "verified" ? (
                  <span className="text-caption font-bold text-muted">{t("work.verified", { name: s.verifierName ?? "" })}</span>
                ) : (
                  <StatusPill variant="asked">{t("work.draft")}</StatusPill>
                )
              }
            />
          ))}
        </div>
      </div>
    </>
  );
}
