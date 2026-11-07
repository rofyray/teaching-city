import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JourneyRoute } from "@/components/public/journey-route";
import { Markdown, sliceBrief } from "@/components/public/markdown";
import { PageShell } from "@/components/public/page-shell";
import { brief } from "@/content/brief";
import { journey } from "@/content/landing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("howItWorks") };
}

const FLOW_ANCHOR = "**1. The Rotation.**";
// Content Pack 13.1.4 (problem and users) and 13.1.5 (solution and platform).
const problem = sliceBrief(brief, "## Exemplar idea", "### Solution");
const solutionIntro = sliceBrief(brief, "### Solution", FLOW_ANCHOR);
const solutionParts = sliceBrief(brief, FLOW_ANCHOR, "**Funding**");

export default async function HowItWorksPage() {
  const t = await getTranslations("nav");
  return (
    <PageShell title={t("howItWorks")}>
      <article>
        <Markdown source={`${problem}\n\n${solutionIntro}`} />
        <JourneyRoute label={journey.label} stations={journey.stations} branches={journey.branches} />
        <Markdown source={solutionParts} />
      </article>
    </PageShell>
  );
}
