import { HandshakeIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate } from "@/components/city/format";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { TableRegion, td, th } from "@/components/city/table-region";
import { EmptyState } from "@/components/empty-state";
import { LineBadge } from "@/components/line-badge";
import { StatusPill } from "@/components/status-pill";
import { CITY_COPY, pick } from "@/content/city-copy";
import { daysBetween, localDate } from "@/domain/time";
import { listClassifications, listPool } from "@/server/queries/city";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pool");
  return { title: t("title") };
}

const STATUS_KEY = { active: "statusActive", offered: "statusOffered", hired: "statusHired", withdrawn: "statusWithdrawn" } as const;

export default async function PoolPage({ searchParams }: { searchParams: Promise<{ classification?: string }> }) {
  const { classification } = await searchParams;
  const t = await getTranslations("pool");
  const locale = await getLocale();
  const classes = await listClassifications();
  const selected = classes.some((c) => c.cls.id === classification) ? classification : undefined;
  const rows = await listPool(selected);
  const today = localDate(new Date(), "America/Chicago");

  return (
    <div className={pageWrap}>
      <PageTitle title={t("title")} lead={t("lead")} />
      <form method="get" className="mt-5 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="pool-filter" className="text-caption font-bold">
            {t("classification")}
          </label>
          <select
            id="pool-filter"
            name="classification"
            defaultValue={selected ?? ""}
            className="min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-2 text-body-sm"
          >
            <option value="">{pick(CITY_COPY.allClassifications, locale)}</option>
            {classes.map((c) => (
              <option key={c.cls.id} value={c.cls.id}>
                {c.cls.title}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body-sm font-bold outline-rule">
          {pick(CITY_COPY.filter, locale)}
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={HandshakeIcon} title={t("emptyTitle")} body={t("emptyBody")} />
        </div>
      ) : (
        <TableRegion label={t("title")}>
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th}>{t("name")}</th>
                <th scope="col" className={th}>{t("classification")}</th>
                <th scope="col" className={th}>{t("unit")}</th>
                <th scope="col" className={th}>{t("entered")}</th>
                <th scope="col" className={th}>{t("daysInPool")}</th>
                <th scope="col" className={th}>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row" className={`${td} text-left font-bold`}>
                    {r.name}
                  </th>
                  <td className={td}>{r.classification}</td>
                  <td className={td}>
                    <span className="flex items-center gap-2">
                      {r.lineLetter ? <LineBadge letter={r.lineLetter} line={r.lineColor ?? undefined} size={24} /> : null}
                      {r.unitName}
                    </span>
                  </td>
                  <td className={`${td} tabular`}>{formatDate(r.enteredAt, locale)}</td>
                  <td className={`${td} tabular`}>{daysBetween(localDate(r.enteredAt, "America/Chicago"), today)}</td>
                  <td className={td}>
                    <StatusPill variant={r.status === "hired" ? "confirmed" : r.status === "offered" ? "due" : "neutral"}>{t(STATUS_KEY[r.status])}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
    </div>
  );
}
