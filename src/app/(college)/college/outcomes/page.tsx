import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CohortFilter, OutcomesTable } from "@/components/city/outcomes-table";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { CITY_COPY, pick } from "@/content/city-copy";
import { requireCollege } from "@/server/queries/city";
import { cohortMetrics, cohortTerms } from "@/server/queries/metrics";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("outcomes");
  return { title: `${t("title")}, ${t("cohort")}` };
}

export default async function CollegeOutcomesPage({ searchParams }: { searchParams: Promise<{ cohort?: string }> }) {
  const { cohort } = await searchParams;
  const { collegeOrgId, collegeName } = await requireCollege();
  const t = await getTranslations("outcomes");
  const locale = await getLocale();
  const terms = await cohortTerms();
  const selected = cohort && terms.includes(cohort) ? cohort : (terms[0] ?? "Spring 2026");
  // Always filtered to the coordinator's own college.
  const { metrics } = await cohortMetrics(selected, collegeOrgId);
  return (
    <div className={pageWrap}>
      <PageTitle title={t("title")} lead={collegeName}>
        <CohortFilter terms={terms} selected={selected} label={t("cohort")} action="/college/outcomes" submitLabel={pick(CITY_COPY.filter, locale)} />
      </PageTitle>
      <h2 className="sr-only">{selected}</h2>
      <OutcomesTable metrics={metrics} />
    </div>
  );
}
