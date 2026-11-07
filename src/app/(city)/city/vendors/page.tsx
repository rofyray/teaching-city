import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate, isoDate } from "@/components/city/format";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { AddPledgeForm, EndPledgeButton } from "@/components/city/pledge-forms";
import { TableRegion, td, th } from "@/components/city/table-region";
import { StatusPill } from "@/components/status-pill";
import { CITY_COPY, pick } from "@/content/city-copy";
import { listVendors } from "@/server/queries/city";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("vendors");
  return { title: t("title") };
}

export default async function VendorsPage() {
  const t = await getTranslations("vendors");
  const locale = await getLocale();
  const rows = await listVendors();
  return (
    <div className={pageWrap}>
      <PageTitle title={t("title")} lead={t("lead")}>
        <AddPledgeForm vendorLabel={pick(CITY_COPY.vendorName, locale)} today={isoDate(new Date())} />
      </PageTitle>
      <TableRegion label={t("title")}>
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              <th scope="col" className={th}>{pick(CITY_COPY.vendorName, locale)}</th>
              <th scope="col" className={th}>{t("contact")}</th>
              <th scope="col" className={th}>{t("roles")}</th>
              <th scope="col" className={th}>{t("pledged")}</th>
              <th scope="col" className={th}>{pick(CITY_COPY.statusLabel, locale)}</th>
              <th scope="col" className={th}>
                <span className="sr-only">{t("end")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ pledge, vendorName, active }) => (
              <tr key={pledge.id}>
                <th scope="row" className={`${td} text-left font-bold`}>
                  {vendorName}
                </th>
                <td className={td}>{pledge.contactName}</td>
                <td className={td}>{pledge.rolesOffered}</td>
                <td className={`${td} tabular`}>{formatDate(pledge.pledgedAt, locale)}</td>
                <td className={td}>
                  <StatusPill variant={active ? "confirmed" : "asked"}>
                    {active ? pick(CITY_COPY.active, locale) : `${pick(CITY_COPY.ended, locale)} ${formatDate(pledge.endedAt, locale)}`}
                  </StatusPill>
                </td>
                <td className={td}>{active ? <EndPledgeButton pledgeId={pledge.id} vendorName={vendorName} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableRegion>
    </div>
  );
}
