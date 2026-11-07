import { GraduationCapIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CohortFilter } from "@/components/city/outcomes-table";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { TableRegion, td, th } from "@/components/city/table-region";
import { EmptyState } from "@/components/empty-state";
import { LineBadge } from "@/components/line-badge";
import { StatusPill } from "@/components/status-pill";
import { CITY_COPY, pick } from "@/content/city-copy";
import { creditOnTrack, formatHours } from "@/domain/rules";
import { collegeCohort, requireCollege } from "@/server/queries/city";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("college");
  return { title: t("title") };
}

export default async function CollegePage({ searchParams }: { searchParams: Promise<{ cohort?: string }> }) {
  const { cohort } = await searchParams;
  const { collegeOrgId, collegeName } = await requireCollege();
  const t = await getTranslations();
  const locale = await getLocale();
  const data = await collegeCohort(collegeOrgId, cohort);

  return (
    <div className={pageWrap}>
      <PageTitle title={t("college.title")} lead={collegeName}>
        {data.terms.length > 0 ? (
          <CohortFilter terms={data.terms} selected={data.term ?? ""} label={t("outcomes.cohort")} action="/college" submitLabel={pick(CITY_COPY.filter, locale)} />
        ) : null}
      </PageTitle>
      {data.students.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={GraduationCapIcon} title={t("college.title")} body={pick(CITY_COPY.noCohort, locale)} />
        </div>
      ) : (
        <TableRegion label={`${t("college.title")}, ${data.term}`}>
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>{pick(CITY_COPY.name, locale)}</th>
                <th scope="col" className={th}>{t("pool.unit")}</th>
                <th scope="col" className={th}>{t("college.consent")}</th>
                <th scope="col" className={th}>{t("college.enrollment")}</th>
                <th scope="col" className={th}>{t("college.hoursToDate")}</th>
                <th scope="col" className={th}>{t("college.creditOnTrack")}</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => {
                const onTrack = creditOnTrack(s.hours, s.weeksElapsed, data.program.minHours);
                const status = s.enrollment.status;
                return (
                  <tr key={s.enrollment.id}>
                    <th scope="row" className={`${td} text-left`}>
                      <span className="block font-bold">{s.name}</span>
                      <span className="text-caption text-muted">{s.major}</span>
                    </th>
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        {s.lineLetter ? <LineBadge letter={s.lineLetter} line={s.lineColor ?? undefined} size={24} /> : null}
                        {s.unitName}
                      </span>
                    </td>
                    <td className={td}>
                      <StatusPill variant={s.consentOk ? "confirmed" : "due"}>
                        {s.consentOk ? pick(CITY_COPY.consentOn, locale) : pick(CITY_COPY.consentMissing, locale)}
                      </StatusPill>
                    </td>
                    <td className={td}>{pick(CITY_COPY.enrollmentStatus[status], locale)}</td>
                    <td className={`${td} tabular`}>{formatHours(s.hours)}</td>
                    <td className={td}>
                      {status === "withdrawn" ? null : (
                        <StatusPill variant={onTrack ? "confirmed" : "due"}>{onTrack ? t("college.creditOnTrack") : t("college.creditBehind")}</StatusPill>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableRegion>
      )}
    </div>
  );
}
