import type { Metadata } from "next";
import { DataTable } from "@/components/public/markdown";
import { PageShell } from "@/components/public/page-shell";
import { aiDisclosure as c } from "@/content/ai-disclosure";

export const metadata: Metadata = { title: c.title };

export default function AiDisclosurePage() {
  const [before, after] = c.models.split("AI_MODEL");
  return (
    <PageShell title={c.title} lead={<p>{c.lead}</p>}>
      <article className="flex flex-col gap-8">
        <DataTable header={[...c.table.headers]} rows={c.table.rows.map((r) => [...r])} label={c.title} />

        <section aria-labelledby="never" className="max-w-[72ch]">
          <h2 id="never" className="text-title font-extrabold">
            {c.neverHeading}
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-6 text-body">
            {c.never.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <p className="max-w-[72ch] text-body">
          <strong className="font-extrabold">{c.modelsLabel}</strong> {before}
          <code className="rounded-[4px] bg-surface px-1 text-body-sm">AI_MODEL</code>
          {after}
        </p>

        <p className="max-w-[72ch] text-body">
          <strong className="font-extrabold">{c.builtWithLabel}</strong> {c.builtWith}
        </p>
      </article>
    </PageShell>
  );
}
