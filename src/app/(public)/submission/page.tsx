import { ArrowSquareOutIcon, CaretDownIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import {
  alternatives,
  criteria,
  DEMO_URL,
  demoSteps,
  equity,
  metrics,
  pilot,
  problem,
  REPO_URL,
  solution,
  sources,
  team,
  title,
  users,
} from "@/content/submission";
import { ExpandAll } from "./expand-all";

export const metadata: Metadata = {
  title: "Submission",
  robots: { index: false, follow: false },
};

const words = (ps: readonly string[]) => ps.join(" ").split(/\s+/).filter(Boolean).length;
const LINES = ["finance", "works", "tech", "community", "info", "safety"];

function Section({ n, title: heading, limit, open, children }: { n: number; title: string; limit?: string; open?: boolean; children: ReactNode }) {
  return (
    <details data-section open={open} data-line={LINES[(n - 1) % LINES.length]} className="group card overflow-hidden">
      <summary className="flex min-h-[64px] cursor-pointer list-none items-center gap-4 px-4 py-3 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-line text-body-sm font-extrabold text-white"
        >
          {n}
        </span>
        <h2 className="flex-1 text-subheading font-extrabold sm:text-heading">{heading}</h2>
        {limit ? <span className="hidden text-caption font-bold text-muted sm:inline">{limit}</span> : null}
        <Icon icon={CaretDownIcon} weight="bold" size={20} className="text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-rule px-4 py-5 sm:px-6 sm:py-6">
        {limit ? <p className="mb-3 text-caption font-bold text-muted sm:hidden">{limit}</p> : null}
        <div className="flex flex-col gap-4 text-body">{children}</div>
      </div>
    </details>
  );
}

function Table({ head, rows, label }: { head: string[]; rows: ReactNode[][]; label: string }) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full border-collapse text-left text-body-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="border-b-2 border-ink py-2 pr-4 font-extrabold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-rule align-top">
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="py-3 pr-4 font-bold">
                    {cell}
                  </th>
                ) : (
                  <td key={j} className="py-3 pr-4">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const H3 = ({ children }: { children: ReactNode }) => <h3 className="mt-2 text-subheading font-extrabold">{children}</h3>;

export default function SubmissionPage() {
  return (
    <>
      <div className="sign bg-ink text-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-end justify-between gap-6 px-4 pt-10 pb-10 sm:px-6 lg:px-10">
          <div>
            <p className="text-caption font-bold text-sign-muted">CityGov Hackathon 2026</p>
            <h1 className="mt-1 text-[36px] leading-[40px] font-extrabold sm:text-display">{title.name}</h1>
            <p className="mt-2 text-[18px] leading-[28px] text-sign-muted">{title.tagline}</p>
          </div>
          <ExpandAll expand="Expand all" collapse="Collapse all" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 py-8 sm:px-6 lg:px-10">
        <Section n={1} title="Project Title" open>
          <p className="text-heading font-extrabold">{title.name}</p>
          <p>{title.summary}</p>
        </Section>

        <Section n={2} title="Team Information">
          <ul className="flex flex-col gap-2">
            {team.map((m) => (
              <li key={m.name}>
                <span className="font-bold">{m.name}</span>, {m.role}
                {m.profileUrl ? (
                  <>
                    {" "}
                    <a href={m.profileUrl} target="_blank" rel="noopener noreferrer" className="font-bold">
                      CityGov profile
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section n={3} title="Problem Statement">
          {problem.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <H3>The Numbers</H3>
          <Table
            label="The numbers"
            head={["Signal", "Figure", "Source"]}
            rows={problem.figures.map((f) => [
              f.signal,
              <span key="f" className="font-extrabold tabular">
                {f.figure}
              </span>,
              <a key="s" href={f.href} target="_blank" rel="noopener noreferrer">
                {f.source}
              </a>,
            ])}
          />
          <H3>Two Sides of the Same Gap</H3>
          <Table label="Two sides of the same gap" head={["Students, especially first-gen", "Local governments"]} rows={problem.sides.map(([a, b]) => [a, b])} />
        </Section>

        <Section n={4} title="Target Users">
          <Table label="Target users" head={["User", "Who", "What they get"]} rows={users.map((u) => [u.user, u.who, u.gets])} />
        </Section>

        <Section n={5} title="Solution Description" limit={`500 to 750 words · ${words(solution)} words`}>
          {solution.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <H3>What Already Exists</H3>
          <Table label="What already exists" head={["Category", "Examples", "What it misses"]} rows={alternatives.map((a) => [a.category, a.examples, a.misses])} />
          <H3>Against the Judging Criteria</H3>
          <Table label="Judging criteria" head={["Criterion", "How Teaching City answers it"]} rows={criteria.map(([a, b]) => [a, b])} />
        </Section>

        <Section n={6} title="Equity Statement" limit={`400 words · ${words(equity)} words`}>
          {equity.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </Section>

        <Section n={7} title="Pilot Plan">
          <H3>1. Pilot Host</H3>
          <p>{pilot.host}</p>
          <H3>2. Participants</H3>
          <p>{pilot.participants}</p>
          <H3>3. Timeline</H3>
          <ol className="flex flex-col gap-2">
            {pilot.timeline.map((m) => (
              <li key={m.when} className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-4">
                <span className="font-extrabold">{m.when}</span>
                <span>{m.what}</span>
              </li>
            ))}
          </ol>
          <H3>4. Resources</H3>
          <ul className="flex flex-col gap-2">
            {pilot.resources.map((r) => (
              <li key={r.label}>
                <span className="font-bold">{r.label}: </span>
                {r.text}
              </li>
            ))}
          </ul>
          <H3>5. Estimated Cost</H3>
          <Table
            label="Estimated cost"
            head={["Item", "Type", "Amount"]}
            rows={[
              ...pilot.cost.oneTime.map((c) => [c.item, "One-time", <span key="a" className="tabular">{c.amount}</span>]),
              ...pilot.cost.ongoing.map((c) => [c.item, "Ongoing, per semester", <span key="a" className="tabular">{c.amount}</span>]),
              ["Total pilot", "", <span key="t" className="font-extrabold tabular">{pilot.cost.total}</span>],
            ]}
          />
          <p className="text-body-sm text-muted">
            {pilot.cost.perStudent}. {pilot.cost.note}
          </p>
          <H3>6. Success Metrics</H3>
          <Table label="Pilot success metrics" head={["Metric", "Target", "How it is measured"]} rows={pilot.metrics.map((m) => [m.metric, m.target, m.how])} />
          <H3>7. Risks and Mitigation</H3>
          <Table label="Risks and mitigation" head={["Risk", "Mitigation"]} rows={pilot.risks.map((r) => [r.risk, r.mitigation])} />
          <H3>8. Scale-Up Path</H3>
          <p>{pilot.scale}</p>
        </Section>

        <Section n={8} title="Success Metrics" limit="Minimum 2">
          <ol className="grid gap-3 md:grid-cols-3">
            {metrics.map((m, i) => (
              <li key={m.name} data-line={LINES[i]} className="rounded-[8px] p-4 outline-rule">
                <p className="text-caption font-extrabold text-line-ink">{m.name}</p>
                <p className="mt-1 font-bold">{m.target}</p>
                <p className="mt-2 text-body-sm text-muted">{m.how}</p>
              </li>
            ))}
          </ol>
          <p className="text-body-sm text-muted">All metrics are computed live from the data on the outcomes dashboard in the demo.</p>
        </Section>

        <Section n={9} title="Demonstration">
          <p>
            <a href={DEMO_URL} className="inline-flex items-center gap-1 font-bold">
              {DEMO_URL.replace("https://", "")}
              <Icon icon={ArrowSquareOutIcon} weight="bold" size={14} />
            </a>{" "}
            opens the working app. Pick a person; no account is needed.
          </p>
          <H3>A 3-Minute Path</H3>
          <ol className="list-decimal pl-6">
            {demoSteps.map((s) => (
              <li key={s.slice(0, 24)} className="mb-1">
                {s}
              </li>
            ))}
          </ol>
          <p>
            Source code:{" "}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="font-bold">
              github.com/rofyray/teaching-city
            </a>
          </p>
        </Section>

        <Section n={10} title="AI-Use Disclosure">
          <p>
            AI helps with three writing tasks inside the product: drafting a preceptor&apos;s weekly note from rough notes, rewriting
            city job classifications in plain language, and suggesting which roles a student&apos;s courses connect to. A person
            accepts, edits or discards every draft, and AI never ranks or screens anyone.
          </p>
          <p>Teaching City was built with Claude Code following a PRD that was designed and put together by the human team. People reviewed every change.</p>
          <p>
            <Link href="/about/ai" className="font-bold">
              Our AI use
            </Link>
          </p>
        </Section>

        <Section n={11} title="Sources and Credits">
          <H3>Research</H3>
          <ul className="flex flex-col gap-1 text-body-sm">
            {sources.research.map((s) => (
              <li key={s.href + s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <H3>Open-Source Components and Services</H3>
          <ul className="grid gap-1 text-body-sm sm:grid-cols-2">
            {sources.tools.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <H3>Data</H3>
          <p className="text-body-sm">{sources.data}</p>
        </Section>
      </div>
    </>
  );
}
