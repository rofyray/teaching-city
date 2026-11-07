import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { LineBadge } from "@/components/line-badge";
import { CITY_COPY, pick } from "@/content/city-copy";
import { listUnits } from "@/server/queries/city";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("city");
  return { title: t("unitsTitle") };
}

export default async function UnitsPage() {
  const t = await getTranslations("city");
  const locale = await getLocale();
  const units = await listUnits();
  return (
    <div className={pageWrap}>
      <PageTitle title={t("unitsTitle")} />
      <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {units.map((u) => (
          <li key={u.id} data-line={u.lineColor} className="card flex flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
              <LineBadge letter={u.lineLetter} line={u.lineColor} />
              <div>
                <h2 className="text-subheading font-extrabold">{u.name}</h2>
                <p className="text-caption text-muted">
                  {u.lineName}, {u.department}
                </p>
              </div>
            </div>
            <p className="tabular text-body-sm font-bold">{t("capacity", { count: u.filled, capacity: u.capacity })}</p>
            {u.classification ? (
              <p className="text-body-sm text-muted">
                {pick(CITY_COPY.classificationLabel, locale)}: {u.classification.title}
              </p>
            ) : null}
            <div>
              <h3 className="text-caption font-extrabold text-muted">{t("preceptors")}</h3>
              <ul className="mt-1 flex flex-col gap-1">
                {u.preceptors.map((p) => (
                  <li key={p.id} className="text-body-sm">
                    <span className="font-bold">{p.name}</span>
                    {p.title ? <span className="text-muted">, {p.title}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
