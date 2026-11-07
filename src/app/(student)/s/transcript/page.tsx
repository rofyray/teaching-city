import { MapTrifoldIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { HeaderActions } from "@/components/header-actions";
import { PrintButton } from "@/components/print-button";
import { Transcript } from "@/components/transcript";
import { getStudentArea } from "@/server/queries/student";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("transcript");
  return { title: t("title") };
}

export default async function StudentTranscriptPage() {
  const { current, view } = await getStudentArea();
  const t = await getTranslations();
  if (!view || view.enrollment.status === "proposed") {
    return (
      <div className="mx-auto w-full max-w-[640px] p-5">
        <h1 className="sr-only">{t("transcript.title")}</h1>
        <EmptyState icon={MapTrifoldIcon} title={t("home.notMatchedTitle")} body={t("home.notMatchedBody")} />
      </div>
    );
  }
  return (
    <Transcript
      view={view}
      variant="owner"
      headerActions={
        <div className="flex items-center gap-1">
          <PrintButton label={t("transcript.print")} />
          <div className="flex lg:hidden">
            <HeaderActions current={current} settingsHref="/s/settings" />
          </div>
        </div>
      }
    />
  );
}
