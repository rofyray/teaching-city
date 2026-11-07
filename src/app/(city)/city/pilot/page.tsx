import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { PilotCalculator } from "@/components/city/pilot-calculator";
import { FUNDING_SOURCES, pick } from "@/content/city-copy";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pilot");
  return { title: t("title") };
}

export default async function PilotPage() {
  const t = await getTranslations("pilot");
  const locale = await getLocale();
  return (
    <div className={pageWrap}>
      <PageTitle title={t("title")} />
      <div className="mt-5">
        <PilotCalculator />
      </div>
      <section aria-labelledby="funding" className="card mt-6 p-5">
        <h2 id="funding" className="text-heading font-extrabold">
          {t("fundingTitle")}
        </h2>
        <ol className="mt-3 list-decimal pl-6 text-body">
          {FUNDING_SOURCES.map((f) => (
            <li key={f.en} className="py-1">
              {pick(f, locale)}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
