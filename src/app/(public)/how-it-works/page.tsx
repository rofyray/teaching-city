import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { LineBadge } from "@/components/line-badge";
import { JourneyRoute } from "@/components/public/journey-route";
import { PageShell } from "@/components/public/page-shell";
import { journey } from "@/content/landing";
import { program } from "@/content/program";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("howItWorks") };
}

export default async function HowItWorksPage() {
  const t = await getTranslations("nav");
  return (
    <PageShell title={t("howItWorks")} lead={program.lead}>
      <div className="flex flex-col gap-14">
        <section aria-labelledby="parts">
          <h2 id="parts" className="text-title font-extrabold">
            {program.partsHeading}
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {program.parts.map((part, i) => (
              <li key={part.title} data-line={part.line} data-reveal="rise" style={{ ["--i" as string]: i }} className="card flex gap-4 p-5 sm:p-6">
                <LineBadge letter={String(i + 1)} line={part.line} />
                <div>
                  <h3 className="text-subheading font-extrabold">{part.title}</h3>
                  <p className="mt-2 text-body">{part.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="journey">
          <h2 id="journey" className="text-title font-extrabold">
            {program.journeyHeading}
          </h2>
          <JourneyRoute label={journey.label} stations={journey.stations} branches={journey.branches} />
        </section>

        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="units" data-reveal="rise">
            <h2 id="units" className="text-title font-extrabold">
              {program.unitsHeading}
            </h2>
            <div className="mt-4 overflow-x-auto" role="region" aria-labelledby="units" tabIndex={0}>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    {program.unitsColumns.map((c) => (
                      <th key={c} scope="col" className="border-b-2 border-ink py-2 pr-4 text-caption font-extrabold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {program.units.map(([major, units]) => (
                    <tr key={major} className="border-b border-rule">
                      <th scope="row" className="py-3 pr-4 text-body-sm font-bold">
                        {major}
                      </th>
                      <td className="py-3 text-body-sm">{units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="platform" data-reveal="rise" style={{ ["--i" as string]: 1 }}>
            <h2 id="platform" className="text-title font-extrabold">
              {program.platformHeading}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {program.platform.map((item) => (
                <li key={item} className="flex items-start gap-3 text-body">
                  <Icon icon={CheckCircleIcon} weight="fill" size={22} className="mt-[1px] text-line-finance" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-body text-muted">
              {program.platformNote}{" "}
              <Link href="/about/ai" className="font-bold">
                {program.aiLink}
              </Link>
            </p>
            <Link
              href="/demo"
              className="mt-6 inline-flex min-h-[52px] items-center rounded-[8px] bg-ink px-8 text-[17px] font-extrabold text-white no-underline"
            >
              {program.cta}
            </Link>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
