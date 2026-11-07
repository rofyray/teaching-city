import { HourglassMediumIcon, QuotesIcon, SealCheckIcon, UsersThreeIcon, XCircleIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { initials } from "@/components/vouch-card";
import { eligibleReferees } from "@/server/actions/student";
import { getStudentArea } from "@/server/queries/student";
import { AskReferenceButton, QuoteToggle } from "./people-controls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("people");
  return { title: t("title") };
}

export default async function PeoplePage() {
  const { current, view } = await getStudentArea();
  const t = await getTranslations();
  if (!view || view.enrollment.status === "proposed") {
    return (
      <>
        <PageHeader title={t("people.title")} current={current} settingsHref="/s/settings" />
        <div className="mx-auto w-full max-w-[640px] p-5">
          <EmptyState icon={UsersThreeIcon} title={t("home.notMatchedTitle")} body={t("home.notMatchedBody")} />
        </div>
      </>
    );
  }
  const referees = await eligibleReferees();
  const titleFor = (id: string | undefined) => referees.find((r) => r.id === id)?.title ?? view.references.find((r) => r.refereeUserId === id)?.refereeTitle ?? null;
  const people = [
    view.preceptor ? { role: t("people.preceptor"), ...view.preceptor } : null,
    view.sponsor ? { role: t("people.sponsor"), ...view.sponsor } : null,
  ].filter((p): p is { role: string; id: string; name: string } => !!p);

  return (
    <>
      <PageHeader title={t("people.title")} current={current} settingsHref="/s/settings" />
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {people.map((p) => (
            <article key={p.id} className="card flex items-center gap-3 p-4">
              <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-line-tint text-caption font-extrabold text-line-ink">
                {initials(p.name)}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-caption font-bold text-muted">{p.role}</span>
                <h2 className="text-body font-extrabold">{p.name}</h2>
                <span className="text-caption text-muted">{[titleFor(p.id), view.unit?.name].filter(Boolean).join(", ")}</span>
              </div>
            </article>
          ))}
        </div>

        <section aria-labelledby="refs" className="card p-4">
          <h2 id="refs" className="flex items-center gap-2 text-subheading font-extrabold">
            <Icon icon={UsersThreeIcon} weight="duotone" size={24} className="text-line" />
            {t("people.referencesTitle")}
            <span className="tabular ml-auto">{t("common.of", { count: view.derived.confirmed, total: view.program.referencesRequired })}</span>
          </h2>
          <ul className="mt-2">
            {view.references.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 border-t border-rule py-3">
                <div className="flex items-center gap-3">
                  {r.status === "confirmed" ? (
                    <Icon icon={SealCheckIcon} weight="fill" size={24} className="text-line" />
                  ) : r.status === "asked" ? (
                    <Icon icon={HourglassMediumIcon} weight="regular" size={24} className="text-muted" />
                  ) : (
                    <Icon icon={XCircleIcon} weight="regular" size={24} className="text-muted" />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-sm font-extrabold">{r.refereeName}</span>
                    <span className="text-caption text-muted">{r.refereeTitle}</span>
                  </span>
                  <span className={r.status === "confirmed" ? "text-caption font-extrabold text-line" : "text-caption font-bold text-muted"}>
                    {t(`people.${r.status}`)}
                  </span>
                </div>
                {r.status === "confirmed" && r.quote && r.quoteApproved ? (
                  <div className="ml-9 flex flex-col gap-1">
                    <p className="flex gap-2 text-body-sm text-muted">
                      <Icon icon={QuotesIcon} weight="duotone" size={18} className="text-line" />
                      <span className={r.quoteHiddenByStudent ? "line-through" : undefined}>{r.quote}</span>
                    </p>
                    <QuoteToggle referenceId={r.id} hidden={r.quoteHiddenByStudent} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {referees.length > 0 && view.enrollment.status === "active" ? (
          <section aria-labelledby="ask" className="card p-4">
            <h2 id="ask" className="text-subheading font-extrabold">
              {t("people.ask")}
            </h2>
            <ul className="mt-2">
              {referees.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 border-t border-rule py-3">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-sm font-extrabold">{r.name}</span>
                    <span className="text-caption text-muted">{r.title}</span>
                  </span>
                  <AskReferenceButton refereeId={r.id} name={r.name} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
