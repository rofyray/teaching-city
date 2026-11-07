import { HandshakeIcon, HourglassMediumIcon, LockSimpleIcon, SealCheckIcon, XCircleIcon } from "@phosphor-icons/react/ssr";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { formatHours, visibleQuote } from "@/domain/rules";
import type { EnrollmentView } from "@/server/queries/enrollment";
import { EvidenceList } from "./evidence-list";
import { Icon } from "./icon";
import { LineBadge } from "./line-badge";
import { RouteHorizontal, type Station } from "./route";
import { SharingControls } from "./share-switch";
import { SkillsGrid } from "./skills-grid";
import { StatusPill } from "./status-pill";
import { VouchCard } from "./vouch-card";
import { EmptySampleSlot, WorkSampleCard } from "./work-sample-card";

export type TranscriptVariant = "owner" | "mentor" | "city" | "vendor" | "public";

const CLASS_YEAR_KEY = {
  junior: "classJunior",
  senior: "classSenior",
  community_college: "classCommunity",
  adult_learner: "classAdult",
} as const;

/** The Civic Transcript (F3) for one enrollment, trimmed to what each viewer may see (P8.4, BR-10). */
export async function Transcript({
  view,
  variant,
  headerActions,
  belowHeader,
  sampleActions,
  shareToken,
}: {
  view: EnrollmentView;
  variant: TranscriptVariant;
  headerActions?: ReactNode;
  belowHeader?: ReactNode;
  /** Extra controls rendered inside each work sample card, for mentors verifying samples. */
  sampleActions?: (sampleId: string, status: "draft" | "verified") => ReactNode;
  /** Public share views pass the link token so the file proxy can check it. */
  shareToken?: string;
}) {
  const t = await getTranslations();
  const { program, unit, classification, derived, student, preceptor } = view;
  const limited = variant === "vendor" || variant === "public";
  const firstName = student.firstName;
  const preceptorFirst = preceptor?.name.split(" ")[0] ?? "";

  const classYear = view.profile.classYear ? t(`onboarding.${CLASS_YEAR_KEY[view.profile.classYear]}`) : null;
  const majorLine = [view.profile.major, classYear ? classYear.charAt(0).toLowerCase() + classYear.slice(1) : null]
    .filter(Boolean)
    .join(", ");

  const completed = view.enrollment.status === "completed";
  const stations: Station[] = [
    { title: t("home.stationMatched"), sub: unit ? `${unit.name}, ${unit.lineName}` : undefined, state: "done" },
    {
      title: t("common.weekOf", { week: derived.week, total: program.weeks }),
      sub: preceptor ? t("transcript.routeHoursWith", { hours: formatHours(derived.totalHours), preceptor: preceptor.name }) : undefined,
      state: completed ? "done" : "here",
    },
    {
      title: t("transcript.routeTranscriptComplete"),
      sub: t("transcript.routeAfterWeek", { week: program.weeks }),
      state: completed ? "done" : "next",
    },
    {
      title: t("transcript.routeExit"),
      sub: t("transcript.routeOfferTarget", { days: program.offerTargetDays }),
      state: completed ? "here" : "next",
    },
  ];

  const submitted = view.ratings.filter((r) => r.submittedAt);
  const weeks = submitted.map((r) => r.week);
  const gridRows = view.competencies.map((c) => ({
    competencyId: c.id,
    label: c.label,
    byWeek: new Map(submitted.map((r) => [r.week, r.scores.find((s) => s.competencyId === c.id)?.level ?? 0] as const).filter(([, l]) => l > 0)),
    latest: derived.latest.get(c.id),
  }));
  const evidenceRows = view.competencies.map((c) => {
    const level = derived.latest.get(c.id);
    return {
      competencyId: c.id,
      label: c.label,
      level,
      levelLabel: level ? t(`levels.${level}` as "levels.1") : undefined,
      sentence: view.evidence.find((e) => e.competencyId === c.id)?.sentence ?? null,
    };
  });
  const hasEvidence = evidenceRows.some((r) => r.sentence);

  const quotes = view.references
    .map((r) => ({ ref: r, quote: visibleQuote(r) }))
    .filter((x): x is { ref: (typeof view.references)[number]; quote: string } => !!x.quote);

  const samples = view.samples.filter((s) => !limited || s.status === "verified");
  const showEmptySlot = variant === "owner" && view.enrollment.status === "active" && !view.samples.some((s) => s.week === derived.rawWeek);

  const refsNeeded = Math.max(program.referencesRequired - derived.confirmed, 0);
  const inPool = view.poolEntry && view.poolEntry.status !== "withdrawn";

  const section = "card print-avoid p-5 sm:p-6 print:p-4";

  return (
    <div data-line={unit?.lineColor} className="flex flex-1 flex-col">
      <header className="sign print-sign bg-ink text-white">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-5 py-6 lg:px-10 lg:pt-6 lg:pb-9">
          {unit ? <LineBadge letter={unit.lineLetter} line={unit.lineColor} size={56} /> : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] leading-[32px] font-extrabold sm:text-display">{student.name}</h1>
            <p className="mt-1 text-body-sm text-sign-muted">
              {t("transcript.subtitle", { major: majorLine, school: view.college?.name ?? "" })}
            </p>
          </div>
          {headerActions}
        </div>
      </header>
      {belowHeader}

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:px-10 lg:[grid-template-areas:'route_route'_'main_side'_'vouch_vouch'_'samples_samples']">
        {!limited ? (
          <section aria-label={t("home.routeLabel")} className={`${section} order-1 lg:[grid-area:route]`}>
            <RouteHorizontal label={t("home.routeLabel")} stations={stations} progress={derived.week / program.weeks} />
          </section>
        ) : null}

        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:[grid-area:main]">
          {!limited ? (
            <section aria-labelledby="t-skills" className={`${section} order-2`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="t-skills" className="text-title font-extrabold">
                  {t("transcript.observedSkills")}
                </h2>
                {classification ? (
                  <span className="text-caption text-muted">{t("transcript.mappedTo", { classification: classification.title })}</span>
                ) : null}
              </div>
              <SkillsGrid rows={gridRows} weeks={weeks} caption={t("transcript.observedSkills")} />
            </section>
          ) : null}

          <section aria-labelledby="t-cando" className={`${section} order-3`}>
            <h2 id="t-cando" className="text-title font-extrabold">
              {t("transcript.whatCanDo", { firstName })}
            </h2>
            {preceptor ? (
              <p className="mt-1 text-caption text-muted">{t("transcript.whatCanDoSub", { preceptor: preceptor.name })}</p>
            ) : null}
            {hasEvidence ? (
              <EvidenceList rows={evidenceRows} />
            ) : (
              <>
                <EvidenceList rows={evidenceRows.map((r) => ({ ...r, sentence: null }))} />
                <p className="border-t border-rule pt-4 text-body-sm text-muted">{t("transcript.whatCanDoEmpty", { preceptor: preceptorFirst })}</p>
              </>
            )}
          </section>
        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-6 lg:[grid-area:side] print:order-4 print:grid print:grid-cols-2 print:items-start print:gap-4">
          {!limited ? (
            <section aria-labelledby="t-toward" className="card print-avoid order-4 p-5 border-2 border-line">
              <h2 id="t-toward" className="flex items-center gap-3 text-[18px] leading-6 font-extrabold">
                <Icon icon={HandshakeIcon} weight="duotone" size={32} className="text-line" />
                {t("transcript.towardLane")}
              </h2>
              <p className="mt-2 text-body-sm text-muted">
                {inPool
                  ? t("transcript.inPool", { classification: classification?.title ?? "" })
                  : t("transcript.towardLaneBody", {
                      count: derived.atBar,
                      classification: classification?.title ?? "",
                      refsNeeded: t("transcript.towardLaneRefs", { count: refsNeeded }),
                    })}
              </p>
            </section>
          ) : null}

          {!limited ? (
            <section aria-labelledby="t-refs" className={`${section} order-7`}>
              <h2 id="t-refs" className="text-[18px] leading-6 font-extrabold">
                {t("transcript.referencesCount", { count: derived.confirmed, total: program.referencesRequired })}
              </h2>
              <ul className="mt-2">
                {view.references.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 border-t border-rule py-3">
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
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {variant === "owner" ? (
            <section aria-labelledby="t-share" className={`${section} no-print order-8`}>
              <h2 id="t-share" className="flex items-center gap-2 text-[18px] leading-6 font-extrabold">
                <Icon icon={LockSimpleIcon} weight="bold" size={22} />
                {t("sharing.title")}
              </h2>
              <div className="mt-2">
                <SharingControls
                  initial={{
                    share_city_hr: view.consent.share_city_hr,
                    share_vendor_bridge: view.consent.share_vendor_bridge,
                    public_link: view.consent.public_link,
                  }}
                />
              </div>
            </section>
          ) : null}
        </div>

        {quotes.length > 0 ? (
          <section aria-labelledby="t-vouch" className="order-5 lg:[grid-area:vouch]">
            <h2 id="t-vouch" className="text-title font-extrabold">
              {t("transcript.whoVouches", { firstName })}
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2 print:grid-cols-2">
              {quotes.map(({ ref, quote }) => (
                <VouchCard key={ref.id} quote={quote} name={ref.refereeName} title={ref.refereeTitle} city={view.cityName} />
              ))}
            </div>
          </section>
        ) : null}

        {samples.length > 0 || showEmptySlot ? (
          <section aria-labelledby="t-samples" className="order-6 lg:[grid-area:samples]">
            <h2 id="t-samples" className="text-title font-extrabold">
              {t("transcript.workSamples")}
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-3">
              {samples.map((s) => (
                <WorkSampleCard
                  key={s.id}
                  title={s.title}
                  meta={[s.description, t("transcript.week", { week: s.week }).toLowerCase()].filter(Boolean).join(", ")}
                  href={`/api/files/${s.id}${shareToken ? `?t=${encodeURIComponent(shareToken)}` : ""}`}
                  linkLabel={t("work.openSample")}
                  status={
                    s.status === "verified" ? (
                      s.verifierName ? (
                        <span className="text-caption font-bold text-muted">{t("work.verified", { name: s.verifierName })}</span>
                      ) : null
                    ) : (
                      <StatusPill variant="asked">{t("work.draft")}</StatusPill>
                    )
                  }
                >
                  {sampleActions?.(s.id, s.status)}
                </WorkSampleCard>
              ))}
              {showEmptySlot ? (
                <EmptySampleSlot
                  title={t("work.emptySlotTitle", { week: derived.rawWeek })}
                  body={t("work.emptySlotBody", { preceptor: preceptorFirst })}
                  href="/s/work"
                />
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
