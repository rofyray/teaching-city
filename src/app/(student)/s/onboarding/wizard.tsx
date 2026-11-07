"use client";

import { CheckCircleIcon, InfoIcon, PlusIcon, SparkleIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useId, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { SignBand } from "@/components/sign-band";
import { windowHours } from "@/domain/rules";
import { cn } from "@/lib/cn";
import { mapCourses, recordAiDecision } from "@/server/actions/ai";
import { finishOnboarding } from "@/server/actions/student";
import type { ScheduleWindow } from "@/server/db/schema";

const STEPS = ["stepWelcome", "stepConsent", "stepAbout", "stepAvailability", "stepCourses", "stepOptional", "stepReview"] as const;
const CATEGORIES = [
  "accounting_finance",
  "business",
  "computer_science_it",
  "communications_marketing",
  "engineering",
  "economics_data_math",
  "social_sciences_psychology",
  "criminal_justice",
  "humanities_arts",
  "other",
] as const;
const CLASS_YEARS = [
  ["junior", "classJunior"],
  ["senior", "classSenior"],
  ["community_college", "classCommunity"],
  ["adult_learner", "classAdult"],
] as const;
const DAYS = [1, 2, 3, 4, 5];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

type Mapping = { classificationCode: string; reason: string; courses: string[] }[];

function toBlocks(windows: ScheduleWindow[]) {
  const set = new Set<string>();
  for (const w of windows) {
    const start = Number(w.start.slice(0, 2));
    const end = Number(w.end.slice(0, 2));
    for (let h = start; h < end; h++) set.add(`${w.day}-${h}`);
  }
  return set;
}

function toWindows(blocks: Set<string>): ScheduleWindow[] {
  const out: ScheduleWindow[] = [];
  for (const day of DAYS) {
    let start: number | null = null;
    for (const h of [...HOURS, 18]) {
      const on = blocks.has(`${day}-${h}`);
      if (on && start === null) start = h;
      if (!on && start !== null) {
        out.push({ day, start: `${String(start).padStart(2, "0")}:00`, end: `${String(h).padStart(2, "0")}:00` });
        start = null;
      }
    }
  }
  return out;
}

export function OnboardingWizard({
  initial,
  classificationTitles,
}: {
  initial: { major: string; majorCategory: string; classYear: string; availability: ScheduleWindow[]; courses: string[] };
  classificationTitles: Record<string, string>;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [participation, setParticipation] = useState(false);
  const [cityHr, setCityHr] = useState(false);
  const [major, setMajor] = useState(initial.major);
  const [majorCategory, setMajorCategory] = useState(initial.majorCategory);
  const [classYear, setClassYear] = useState(initial.classYear);
  const [blocks, setBlocks] = useState(() => toBlocks(initial.availability));
  const [courses, setCourses] = useState<string[]>(initial.courses.length ? initial.courses : [""]);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [mappingEvent, setMappingEvent] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [demoConsent, setDemoConsent] = useState(false);
  const [demo, setDemo] = useState({ firstGen: false, pell: false, adultLearner: false, veteran: false });
  const [skipped, setSkipped] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();

  const free = windowHours(toWindows(blocks));
  const dayName = (d: number) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 4 + d)));
  const hourName = (h: number) => new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 5, h)));

  function validate(s: number): string[] {
    if (s === 1 && !(participation && cityHr)) return [t("onboarding.consentRequired")];
    if (s === 2) {
      const e = [];
      if (!major.trim()) e.push(t("onboarding.majorLabel"));
      if (!majorCategory) e.push(t("onboarding.majorCategoryLabel"));
      if (!classYear) e.push(t("onboarding.classYearLabel"));
      return e;
    }
    if (s === 3 && free < 10) return [t("onboarding.availabilityTooFew")];
    return [];
  }

  function go(next: number) {
    if (next > step) {
      const e = validate(step);
      setErrors(e);
      if (e.length) return;
    } else setErrors([]);
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function showRoles() {
    setAiMessage(null);
    startTransition(async () => {
      const result = await mapCourses(courses.filter((c) => c.trim()));
      if (!result.ok) {
        setAiMessage(result.error === "limit" ? t("ai.limit") : t("ai.unavailable"));
        return;
      }
      setMapping(result.mapping.matches);
      setMappingEvent(result.eventId);
    });
  }

  function finish() {
    const all = [1, 2, 3].flatMap(validate);
    if (all.length) {
      setErrors(all);
      return;
    }
    startTransition(async () => {
      const result = await finishOnboarding({
        participation: true,
        cityHr: true,
        major,
        majorCategory: majorCategory as (typeof CATEGORIES)[number],
        classYear: classYear as "junior",
        availability: toWindows(blocks),
        courses: courses.map((c) => c.trim()).filter(Boolean),
        demographics: skipped || !demoConsent ? null : { consent: true, ...demo },
        courseMapping: mapping,
      });
      if (!result.ok) {
        setErrors([result.error === "consentRequired" ? t("onboarding.consentRequired") : result.error === "availabilityTooFew" ? t("onboarding.availabilityTooFew") : t("errors.generic")]);
        return;
      }
      if (mappingEvent) void recordAiDecision(mappingEvent, true);
      setFinished(true);
    });
  }

  const check = "mt-1 h-6 w-6 shrink-0 accent-[var(--tc-ink)]";
  const field = "min-h-[48px] w-full rounded-[8px] border-2 border-rule bg-surface px-3 text-body";

  return (
    <div className="flex flex-1 flex-col">
      <SignBand title={t(`onboarding.${STEPS[step]}`)} subtitle={t("onboarding.stepOf", { step: step + 1, total: STEPS.length })} />
      <ol aria-label={t("onboarding.stepOf", { step: step + 1, total: STEPS.length })} className="mx-auto flex w-full max-w-[640px] items-center px-5 pt-4">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center last:flex-none" aria-current={i === step ? "step" : undefined}>
            <span
              aria-hidden="true"
              className={cn(
                "block shrink-0 rounded-full bg-surface",
                i < step && "h-[14px] w-[14px] bg-line",
                i === step && "h-[18px] w-[18px] shadow-[inset_0_0_0_5px_var(--tc-line)]",
                i > step && "h-3 w-3 shadow-[inset_0_0_0_2px_var(--tc-future)]",
              )}
            />
            <span className="sr-only">{t(`onboarding.${s}`)}</span>
            {i < STEPS.length - 1 ? <span aria-hidden="true" className={cn("h-1 flex-1", i < step ? "bg-line" : "bg-future")} /> : null}
          </li>
        ))}
      </ol>

      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-5 py-5">
        {finished ? (
          <div className="card flex flex-col gap-4 p-5">
            <p role="status" className="flex items-center gap-2 text-body font-bold">
              <Icon icon={CheckCircleIcon} weight="fill" size={24} className="text-line" />
              {t("onboarding.finished")}
            </p>
            <Link href="/s" className="inline-flex min-h-[48px] items-center justify-center rounded-[8px] bg-ink px-4 text-body font-extrabold text-white no-underline">
              {t("common.done")}
            </Link>
          </div>
        ) : (
          <>
            {errors.length > 0 ? (
              <div role="alert" className="card p-4 outline-ink">
                <h2 className="flex items-center gap-2 text-subheading font-extrabold text-due">
                  <Icon icon={WarningCircleIcon} weight="bold" size={20} />
                  {t("errors.summaryTitle")}
                </h2>
                <ul className="mt-2 list-disc pl-6 text-body-sm">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <section className="card flex flex-col gap-4 p-5" aria-labelledby={`${id}-h`}>
              <h2 id={`${id}-h`} ref={headingRef} tabIndex={-1} className="text-heading font-extrabold">
                {step === 0 && t("onboarding.welcomeTitle")}
                {step === 1 && t("onboarding.consentTitle")}
                {step === 2 && t("onboarding.aboutTitle")}
                {step === 3 && t("onboarding.availabilityTitle")}
                {step === 4 && t("onboarding.coursesTitle")}
                {step === 5 && t("onboarding.optionalTitle")}
                {step === 6 && t("onboarding.reviewTitle")}
              </h2>

              {step === 0 ? <p className="text-body">{t("onboarding.welcomeBody")}</p> : null}

              {step === 1 ? (
                <>
                  <label className="flex gap-3 text-body">
                    <input type="checkbox" className={check} checked={participation} onChange={(e) => setParticipation(e.target.checked)} />
                    {t("onboarding.consentParticipation")}
                  </label>
                  <label className="flex gap-3 text-body">
                    <input type="checkbox" className={check} checked={cityHr} onChange={(e) => setCityHr(e.target.checked)} />
                    {t("onboarding.consentCityHr")}
                  </label>
                  <p className="text-body-sm text-muted">{t("onboarding.consentNote")}</p>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`${id}-major`} className="text-body-sm font-bold">
                      {t("onboarding.majorLabel")}
                    </label>
                    <input id={`${id}-major`} value={major} maxLength={120} onChange={(e) => setMajor(e.target.value)} className={field} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`${id}-cat`} className="text-body-sm font-bold">
                      {t("onboarding.majorCategoryLabel")}
                    </label>
                    <select id={`${id}-cat`} value={majorCategory} onChange={(e) => setMajorCategory(e.target.value)} className={field}>
                      <option value="" />
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {t(`majorCategories.${c}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-body-sm font-bold">{t("onboarding.classYearLabel")}</legend>
                    {CLASS_YEARS.map(([value, key]) => (
                      <label key={value} className="flex min-h-[44px] items-center gap-3 text-body">
                        <input type="radio" name="classYear" value={value} checked={classYear === value} onChange={() => setClassYear(value)} className="h-5 w-5" />
                        {t(`onboarding.${key}`)}
                      </label>
                    ))}
                  </fieldset>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <p className="text-body">{t("onboarding.availabilityBody")}</p>
                  <div className="overflow-x-auto" role="region" aria-label={t("onboarding.availabilityTitle")} tabIndex={0}>
                    <table className="w-full min-w-[320px] border-separate border-spacing-1">
                      <thead>
                        <tr>
                          <td />
                          {DAYS.map((d) => (
                            <th key={d} scope="col" className="text-micro font-extrabold text-muted">
                              {dayName(d)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {HOURS.map((h) => (
                          <tr key={h}>
                            <th scope="row" className="pr-1 text-right text-micro font-bold whitespace-nowrap text-muted">
                              {hourName(h)}
                            </th>
                            {DAYS.map((d) => {
                              const key = `${d}-${h}`;
                              const on = blocks.has(key);
                              return (
                                <td key={key}>
                                  <button
                                    type="button"
                                    aria-pressed={on}
                                    aria-label={`${dayName(d)} ${hourName(h)}`}
                                    onClick={() =>
                                      setBlocks((b) => {
                                        const next = new Set(b);
                                        if (on) next.delete(key);
                                        else next.add(key);
                                        return next;
                                      })
                                    }
                                    className={cn("h-11 w-full min-w-11 rounded-[6px] border-2", on ? "border-ink bg-ink" : "border-rule bg-surface")}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="tabular text-body font-extrabold" aria-live="polite">
                    {t("onboarding.availabilityTotal", { hours: free })}
                  </p>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <p className="text-body">{t("onboarding.coursesBody")}</p>
                  {courses.map((c, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <label htmlFor={`${id}-c${i}`} className="text-body-sm font-bold">
                          {t("onboarding.courseLabel")}
                        </label>
                        <input
                          id={`${id}-c${i}`}
                          value={c}
                          maxLength={80}
                          onChange={(e) => setCourses((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
                          className={field}
                        />
                      </div>
                      {courses.length > 1 ? (
                        <button
                          type="button"
                          aria-label={`${t("onboarding.removeCourse")} ${c}`}
                          onClick={() => setCourses((all) => all.filter((_, j) => j !== i))}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] outline-rule"
                        >
                          <Icon icon={XIcon} weight="bold" size={18} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {courses.length < 20 ? (
                    <button type="button" onClick={() => setCourses((all) => [...all, ""])} className="inline-flex min-h-[44px] items-center gap-2 self-start text-body-sm font-bold">
                      <Icon icon={PlusIcon} weight="bold" size={18} />
                      {t("onboarding.addCourse")}
                    </button>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={showRoles}
                      disabled={pending || !courses.some((c) => c.trim())}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] bg-line-tint px-3 text-body-sm font-extrabold text-line-ink disabled:opacity-60"
                    >
                      <Icon icon={SparkleIcon} weight="duotone" size={20} />
                      {t("onboarding.showRoles")}
                    </button>
                    <Link href="/about/ai" aria-label={t("common.aiDisclosureLink")} className="inline-flex h-11 w-11 items-center justify-center text-muted">
                      <Icon icon={InfoIcon} weight="regular" size={20} />
                    </Link>
                  </div>
                  {aiMessage ? (
                    <p role="status" className="text-body-sm font-bold text-due">
                      {aiMessage}
                    </p>
                  ) : null}
                  {mapping ? (
                    <div className="rounded-[8px] bg-line-tint p-4" aria-live="polite">
                      <h3 className="text-body font-extrabold">{t("onboarding.rolesYourCourses")}</h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {mapping.map((m) => (
                          <li key={m.classificationCode} className="text-body-sm">
                            <span className="font-extrabold">{classificationTitles[m.classificationCode] ?? m.classificationCode}</span>
                            <span className="block text-muted">{m.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {step === 5 ? (
                <>
                  <p className="text-body">{t("onboarding.optionalBody")}</p>
                  <label className="flex gap-3 text-body font-bold">
                    <input type="checkbox" className={check} checked={demoConsent} onChange={(e) => setDemoConsent(e.target.checked)} />
                    {t("onboarding.consentDemographic")}
                  </label>
                  {(["firstGen", "pell", "adultLearner", "veteran"] as const).map((k) => (
                    <label key={k} className="flex gap-3 text-body">
                      <input
                        type="checkbox"
                        className={check}
                        disabled={!demoConsent}
                        checked={demo[k]}
                        onChange={(e) => setDemo((d) => ({ ...d, [k]: e.target.checked }))}
                      />
                      {t(`onboarding.${k}`)}
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSkipped(true);
                      setDemoConsent(false);
                      go(6);
                    }}
                    className="inline-flex min-h-[44px] items-center self-start text-body-sm font-bold underline"
                  >
                    {t("onboarding.skip")}
                  </button>
                </>
              ) : null}

              {step === 6 ? (
                <dl className="grid grid-cols-1 gap-3 text-body sm:grid-cols-[auto_1fr] sm:gap-x-6">
                  <dt className="font-bold">{t("onboarding.majorLabel")}</dt>
                  <dd className="text-muted">{major}</dd>
                  <dt className="font-bold">{t("onboarding.majorCategoryLabel")}</dt>
                  <dd className="text-muted">{majorCategory ? t(`majorCategories.${majorCategory as "other"}`) : ""}</dd>
                  <dt className="font-bold">{t("onboarding.classYearLabel")}</dt>
                  <dd className="text-muted">{CLASS_YEARS.find(([v]) => v === classYear) ? t(`onboarding.${CLASS_YEARS.find(([v]) => v === classYear)![1]}`) : ""}</dd>
                  <dt className="font-bold">{t("onboarding.availabilityTitle")}</dt>
                  <dd className="text-muted">{t("onboarding.availabilityTotal", { hours: free })}</dd>
                  <dt className="font-bold">{t("onboarding.coursesTitle")}</dt>
                  <dd className="text-muted">{courses.filter((c) => c.trim()).join(", ")}</dd>
                </dl>
              ) : null}
            </section>

            <div className="flex flex-wrap justify-between gap-3">
              {step > 0 ? (
                <button type="button" onClick={() => go(step - 1)} className="min-h-[48px] rounded-[8px] bg-surface px-5 text-body font-bold outline-rule">
                  {t("common.back")}
                </button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={() => go(step + 1)} className="min-h-[48px] rounded-[8px] bg-ink px-5 text-body font-extrabold text-white">
                  {t("common.continue")}
                </button>
              ) : (
                <button type="button" onClick={finish} disabled={pending} className="min-h-[48px] rounded-[8px] bg-ink px-5 text-body font-extrabold text-white disabled:opacity-70">
                  {t("onboarding.finish")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
