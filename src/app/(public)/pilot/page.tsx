import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Markdown, sliceBrief } from "@/components/public/markdown";
import { PageShell } from "@/components/public/page-shell";
import { brief } from "@/content/brief";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("pilot") };
}

// Content Pack 13.1.6 (funding, pilot, metrics) and 13.1.7 (why it is different).
const source = sliceBrief(brief, "**Funding**");

export default async function PilotPage() {
  const t = await getTranslations("nav");
  return (
    <PageShell title={t("pilot")}>
      <article>
        <Markdown source={source} />
      </article>
    </PageShell>
  );
}
