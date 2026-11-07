"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { RatingControl } from "@/components/rating-control";
import { SignBand } from "@/components/sign-band";
import { draftNote, recordAiDecision } from "@/server/actions/ai";
import { submitRating } from "@/server/actions/mentor";
import type { NoteDraft } from "@/server/ai/schemas";
import { toast } from "@/components/toast";

type Competency = { id: string; position: number; label: string; lastWeek?: number };

export function CheckIn({
  enrollmentId,
  week,
  firstName,
  signer,
  competencies,
  initialLevels,
  initialNote,
  line,
  icons,
}: {
  enrollmentId: string;
  week: number;
  firstName: string;
  signer: string;
  competencies: Competency[];
  initialLevels: Record<string, number>;
  initialNote: string;
  line?: string;
  /** Icons rendered on the server, so they ship as HTML rather than JavaScript. */
  icons: { back: ReactNode; warning: ReactNode; sparkle: ReactNode; info: ReactNode; signature: ReactNode; check: ReactNode };
}) {
  const t = useTranslations();
  const router = useRouter();
  const id = useId();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [levels, setLevels] = useState<Record<string, number>>(initialLevels);
  const [note, setNote] = useState(initialNote);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiState, setAiState] = useState<{ eventId: string; draft: NoteDraft } | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [usedDraft, setUsedDraft] = useState(false);
  const [suggestions, setSuggestions] = useState<{ competencyId: string; sentence: string; keep: boolean }[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [drafting, startDrafting] = useTransition();
  const [submitting, startSubmitting] = useTransition();
  const [done, setDone] = useState(false);

  const rated = competencies.filter((c) => levels[c.id]).length;
  const missing = competencies.filter((c) => !levels[c.id]);

  function requestDraft() {
    setAiMessage(null);
    if (note.trim().length < 10) {
      setAiMessage(t("ai.needNotes"));
      return;
    }
    startDrafting(async () => {
      const byPosition = Object.fromEntries(competencies.map((c) => [c.position, levels[c.id]]));
      const result = await draftNote({ enrollmentId, week, notes: note, levels: byPosition });
      if (!result.ok) {
        const message = result.error === "needNotes" ? t("ai.needNotes") : result.error === "limit" ? t("ai.limit") : t("ai.unavailable");
        setAiMessage(message);
        toast.error(message);
        return;
      }
      setAiState({ eventId: result.eventId, draft: result.draft });
      setEventId(result.eventId);
    });
  }

  function useDraft() {
    if (!aiState) return;
    setNote(aiState.draft.note);
    setUsedDraft(true);
    setSuggestions(
      aiState.draft.evidence
        .filter((e) => e.sentence)
        .map((e) => ({
          competencyId: competencies.find((c) => c.position === e.competencyPosition)?.id ?? "",
          sentence: e.sentence ?? "",
          keep: true,
        }))
        .filter((s) => s.competencyId),
    );
    setAiState(null);
  }

  function discardDraft() {
    if (aiState) void recordAiDecision(aiState.eventId, false);
    setAiState(null);
  }

  function submit() {
    setError(null);
    if (missing.length > 0) {
      setShowErrors(true);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    if (note.length > 600) {
      setShowErrors(true);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    startSubmitting(async () => {
      const result = await submitRating({
        enrollmentId,
        week,
        levels,
        note,
        noteAiAssisted: usedDraft,
        aiEventId: eventId,
        evidence: suggestions.filter((s) => s.keep && s.sentence.trim()).map(({ competencyId, sentence }) => ({ competencyId, sentence })),
      });
      if (!result.ok) {
        const message = result.error === "missing" ? t("rating.missing") : t("errors.generic");
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(t("rating.submitted", { week, firstName }));
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 px-5 py-6" data-line={line}>
        <p role="status" className="card p-5 text-body font-bold">
          {t("rating.submitted", { week, firstName })}
        </p>
        <Link href="/m" className="inline-flex min-h-[48px] items-center justify-center rounded-[8px] bg-ink px-4 text-body font-extrabold text-white no-underline">
          {t("common.done")}
        </Link>
      </div>
    );
  }

  const errorItems = [
    ...(missing.length > 0 && showErrors ? [{ href: `#${id}-${missing[0].id}`, text: t("rating.missing") }] : []),
    ...(note.length > 600 && showErrors ? [{ href: `#${id}-note`, text: t("note.tooLong") }] : []),
  ];

  return (
    <>
      <SignBand
        title={t("rating.title", { firstName, week })}
        subtitle={t("rating.subtitle")}
        line={line}
        leading={
          <Link href="/m" aria-label={t("common.back")} className="-ml-2 inline-flex h-11 w-11 items-center justify-center text-white">
            {icons.back}
          </Link>
        }
        action={
          <span role="status" aria-live="polite" className="tabular inline-flex items-center rounded-[14px] bg-line px-[10px] py-1 text-caption font-extrabold text-white">
            {t("rating.progress", { count: rated })}
          </span>
        }
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mx-auto grid w-full max-w-[1280px] gap-4 px-5 pt-4 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6 lg:px-10 lg:pt-8"
      >
        {errorItems.length > 0 ? (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="card p-4 outline-ink lg:col-span-2">
            <h2 className="flex items-center gap-2 text-subheading font-extrabold text-due">
              {icons.warning}
              {t("errors.summaryTitle")}
            </h2>
            <ul className="mt-2 list-disc pl-6">
              {errorItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.text}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {competencies.map((c) => (
          <div key={c.id} id={`${id}-${c.id}`}>
            <RatingControl
              id={`${id}-${c.id}-rc`}
              label={c.label}
              value={levels[c.id]}
              lastWeek={c.lastWeek}
              invalid={showErrors}
              onChange={(level) => setLevels((l) => ({ ...l, [c.id]: level }))}
              checkIcon={icons.check}
            />
          </div>
        ))}

        <div className="card flex flex-col gap-2 p-3 outline-rule lg:col-span-2">
          <label htmlFor={`${id}-note`} className="text-subheading font-extrabold">
            {t("note.label", { firstName })}
          </label>
          <textarea
            id={`${id}-note`}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={note.length > 600 || undefined}
            aria-describedby={note.length > 500 ? `${id}-count` : undefined}
            className="resize-y bg-transparent text-body-sm text-ink"
          />
          {note.length > 500 ? (
            <p id={`${id}-count`} className={note.length > 600 ? "text-caption font-bold text-due" : "text-caption text-muted"}>
              {note.length > 600 ? t("note.tooLong") : t("note.count", { count: note.length })}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-2">
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={requestDraft}
                disabled={drafting}
                className="inline-flex min-h-[44px] items-center gap-[6px] rounded-[8px] bg-line-tint px-3 text-caption font-extrabold text-line-ink disabled:opacity-60"
              >
                {icons.sparkle}
                {drafting ? t("ai.drafting") : t("ai.draftButton")}
              </button>
              <Link href="/about/ai" aria-label={t("common.aiDisclosureLink")} className="inline-flex h-11 w-11 items-center justify-center text-muted">
                {icons.info}
              </Link>
            </span>
            <span className="flex items-center gap-[6px] text-caption font-bold text-muted">
              {icons.signature}
              {t("note.signed", { name: signer })}
            </span>
          </div>
          {aiMessage ? (
            <p role="status" className="text-caption font-bold text-due">
              {aiMessage}
            </p>
          ) : null}
        </div>

        {aiState ? (
          <section aria-labelledby={`${id}-draft`} className="lg:col-span-2 card flex flex-col gap-3 p-4 border-2 border-line">
            <h2 id={`${id}-draft`} className="flex items-center gap-2 text-subheading font-extrabold">
              <span className="text-line">{icons.sparkle}</span>
              {t("ai.draftButton")}
            </h2>
            <p className="text-body">{aiState.draft.note}</p>
            {aiState.draft.evidence.some((e) => e.sentence) ? (
              <div>
                <h3 className="text-caption font-extrabold text-muted">{t("ai.evidenceSuggestions")}</h3>
                <ul className="mt-1 flex flex-col gap-1">
                  {aiState.draft.evidence
                    .filter((e) => e.sentence)
                    .map((e) => (
                      <li key={e.competencyPosition} className="text-body-sm">
                        <span className="font-bold">{competencies.find((c) => c.position === e.competencyPosition)?.label}: </span>
                        {e.sentence}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={useDraft} className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white">
                {t("ai.useDraft")}
              </button>
              <button type="button" onClick={discardDraft} className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body-sm font-bold outline-rule">
                {t("ai.discard")}
              </button>
            </div>
            <p className="text-caption text-muted">{t("ai.label")}</p>
          </section>
        ) : null}

        {suggestions.length > 0 ? (
          <section aria-labelledby={`${id}-sugg`} className="lg:col-span-2 card flex flex-col gap-3 p-4 outline-rule">
            <h2 id={`${id}-sugg`} className="text-subheading font-extrabold">
              {t("ai.evidenceSuggestions")}
            </h2>
            {suggestions.map((s, i) => {
              const label = competencies.find((c) => c.id === s.competencyId)?.label ?? "";
              return (
                <div key={s.competencyId} className="flex flex-col gap-2 border-t border-rule pt-3 first-of-type:border-t-0">
                  <label htmlFor={`${id}-sugg-${i}`} className="text-body-sm font-extrabold">
                    {label}
                  </label>
                  <textarea
                    id={`${id}-sugg-${i}`}
                    rows={2}
                    maxLength={200}
                    value={s.sentence}
                    disabled={!s.keep}
                    onChange={(e) => setSuggestions((all) => all.map((x, j) => (j === i ? { ...x, sentence: e.target.value } : x)))}
                    className="rounded-[8px] border-2 border-rule p-2 text-body-sm disabled:text-muted disabled:line-through"
                  />
                  <div className="flex gap-2" role="group" aria-label={label}>
                    {(["keep", "skip"] as const).map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        aria-pressed={choice === "keep" ? s.keep : !s.keep}
                        onClick={() => setSuggestions((all) => all.map((x, j) => (j === i ? { ...x, keep: choice === "keep" } : x)))}
                        className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body-sm font-bold outline-rule aria-pressed:bg-ink aria-pressed:text-white"
                      >
                        {choice === "keep" ? t("ai.keep") : t("ai.skipOne")}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="text-caption text-muted">{t("ai.label")}</p>
          </section>
        ) : null}

        {error ? (
          <p role="alert" className="text-body-sm font-bold text-due lg:col-span-2">
            {error}
          </p>
        ) : null}

        <div className="pt-4 pb-5 lg:col-span-2 lg:mx-auto lg:w-[480px]">
          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-[52px] w-full items-center justify-center rounded-[8px] bg-ink text-[17px] font-extrabold text-white disabled:opacity-70"
          >
            {t("rating.submit", { week })}
          </button>
          <p className="mt-2 text-center text-micro text-muted">{t("rating.footer")}</p>
        </div>
      </form>
    </>
  );
}

