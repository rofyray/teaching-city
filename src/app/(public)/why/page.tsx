import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Markdown, sliceBrief } from "@/components/public/markdown";
import { PageShell } from "@/components/public/page-shell";
import { brief } from "@/content/brief";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("why") };
}

// Content Pack 13.1.2 and 13.1.3. The one edit: the site speaks for the program, not one author.
const source = sliceBrief(brief, "## Landscape research", "## Exemplar idea").replace(
  "My read of the research is that",
  "Our read of the research is that",
);

export default async function WhyPage() {
  const t = await getTranslations("nav");
  return (
    <PageShell title={t("why")}>
      <article>
        <Markdown source={source} />
      </article>
    </PageShell>
  );
}
