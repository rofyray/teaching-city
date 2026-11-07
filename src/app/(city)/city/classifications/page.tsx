import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { PlainLanguageEditor } from "@/components/city/plain-language-editor";
import { LineBadge } from "@/components/line-badge";
import { StatusPill } from "@/components/status-pill";
import { CITY_COPY, pick } from "@/content/city-copy";
import { db } from "@/server/db";
import { competencies } from "@/server/db/schema";
import { listClassifications } from "@/server/queries/city";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("classifications") };
}

export default async function ClassificationsPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const rows = await listClassifications();
  const comps = await db.select().from(competencies).orderBy(asc(competencies.position));
  return (
    <div className={pageWrap}>
      <PageTitle title={t("nav.classifications")} />
      <ul className="mt-5 flex flex-col gap-5">
        {rows.map(({ cls, unitName, lineColor, lineLetter }) => (
          <li key={cls.id} data-line={lineColor ?? undefined} className="card flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              {lineLetter ? <LineBadge letter={lineLetter} line={lineColor ?? undefined} size={32} /> : null}
              <div className="min-w-0 flex-1">
                <h2 className="text-subheading font-extrabold">
                  {cls.title} ({cls.code})
                </h2>
                {unitName ? <p className="text-caption text-muted">{unitName}</p> : null}
              </div>
              <StatusPill variant={cls.plainStatus === "approved" ? "confirmed" : cls.plainStatus === "draft" ? "due" : "asked"}>
                {pick(CITY_COPY.plainStatus[cls.plainStatus], locale)}
              </StatusPill>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-caption font-extrabold text-muted">{pick(CITY_COPY.officialDescription, locale)}</h3>
                <p className="mt-1 text-body-sm">{cls.rawDescription}</p>
                <ol className="mt-3 list-decimal pl-5 text-body-sm">
                  {comps
                    .filter((c) => c.classificationId === cls.id)
                    .map((c) => (
                      <li key={c.id}>{c.label}</li>
                    ))}
                </ol>
              </div>
              <PlainLanguageEditor
                classificationId={cls.id}
                initial={cls.plainSummary}
                labels={{ summary: pick(CITY_COPY.summary, locale), onePerLine: pick(CITY_COPY.onePerLine, locale) }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
