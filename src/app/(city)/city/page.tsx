import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { CompleteRotation } from "@/components/city/complete-rotation";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { TableRegion, td, th } from "@/components/city/table-region";
import { LineBadge } from "@/components/line-badge";
import { CITY_COPY, pick } from "@/content/city-copy";
import { getOverview } from "@/server/queries/city";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("cityOverview") };
}

export default async function CityOverviewPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const data = await getOverview();
  const stats = [
    { label: t("city.activeEnrollments"), value: data.active.length, href: "#active" },
    { label: t("city.ratingsOverdue"), value: data.overdue.length, href: "#overdue", due: data.overdue.length > 0 },
    { label: t("city.poolSize"), value: data.poolSize, href: "/city/pool" },
    { label: t("city.openRequests"), value: data.openRequests, href: "/city/vendors" },
  ];
  return (
    <div className={pageWrap}>
      <PageTitle title={t("city.overviewTitle")} />
      <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`card flex min-h-[96px] flex-col justify-between gap-2 p-4 text-ink no-underline ${s.due ? "bg-due-tint" : ""}`}>
              <span className={`text-body-sm font-bold ${s.due ? "text-due" : "text-muted"}`}>{s.label}</span>
              <span className="tabular text-display font-extrabold">{s.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="units-h" className="mt-8">
        <h2 id="units-h" className="text-heading font-extrabold">
          {pick(CITY_COPY.enrollmentsByUnit, locale)}
        </h2>
        <TableRegion label={pick(CITY_COPY.enrollmentsByUnit, locale)}>
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>{t("pool.unit")}</th>
                <th scope="col" className={th}>{pick(CITY_COPY.department, locale)}</th>
                <th scope="col" className={th}>{pick(CITY_COPY.students, locale)}</th>
              </tr>
            </thead>
            <tbody>
              {data.units.map((u) => (
                <tr key={u.id}>
                  <th scope="row" className={`${td} text-left font-bold`}>
                    <span className="flex items-center gap-3">
                      <LineBadge letter={u.lineLetter} line={u.lineColor} size={28} />
                      {u.name}
                    </span>
                  </th>
                  <td className={td}>{u.department}</td>
                  <td className={`${td} tabular`}>{t("city.capacity", { count: u.filled, capacity: u.capacity })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      </section>

      <section id="overdue" aria-labelledby="overdue-h" className="mt-8">
        <h2 id="overdue-h" className="text-heading font-extrabold">
          {t("city.ratingsOverdue")}
        </h2>
        {data.overdue.length === 0 ? (
          <p className="mt-2 text-body-sm text-muted">{t("notifications.empty")}</p>
        ) : (
          <ul className="card mt-3">
            {data.overdue.map((e, i) => (
              <li key={e.id} className={`flex items-center gap-3 px-4 py-3 ${i ? "border-t border-rule" : ""}`}>
                {e.lineLetter ? <LineBadge letter={e.lineLetter} line={e.lineColor ?? undefined} size={28} /> : null}
                <span className="flex-1 text-body font-bold">{e.studentName}</span>
                <span className="text-body-sm text-muted">{e.unitName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="active" aria-labelledby="active-h" className="mt-8">
        <h2 id="active-h" className="text-heading font-extrabold">
          {t("city.activeEnrollments")}
        </h2>
        <TableRegion label={t("city.activeEnrollments")}>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>{t("pool.name")}</th>
                <th scope="col" className={th}>{t("pool.unit")}</th>
                <th scope="col" className={th}>{pick(CITY_COPY.week, locale)}</th>
                <th scope="col" className={th}>
                  <span className="sr-only">{t("city.completeRotation")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.active.map((e) => (
                <tr key={e.id}>
                  <th scope="row" className={`${td} text-left font-bold`}>
                    {e.studentName}
                  </th>
                  <td className={td}>{e.unitName}</td>
                  <td className={`${td} tabular`}>{t("common.weekOf", { week: e.week, total: data.program.weeks })}</td>
                  <td className={td}>
                    <CompleteRotation enrollmentId={e.id} early={e.week < data.program.weeks} weeks={data.program.weeks} name={e.studentName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      </section>
    </div>
  );
}
