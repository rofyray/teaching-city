"use client";

import { InfoIcon, SparkleIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { draftPlainLanguage, recordAiDecision } from "@/server/actions/ai";
import { approvePlainLanguage } from "@/server/actions/city";
import { toast } from "@/components/toast";

type Plain = { summary: string; dayToDay: string[]; whatYouNeed: string[] };

export function PlainLanguageEditor({
  classificationId,
  initial,
  labels,
}: {
  classificationId: string;
  initial: Plain | null;
  labels: { summary: string; onePerLine: string };
}) {
  const t = useTranslations();
  const router = useRouter();
  const id = useId();
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [dayToDay, setDayToDay] = useState((initial?.dayToDay ?? []).join("\n"));
  const [need, setNeed] = useState((initial?.whatYouNeed ?? []).join("\n"));
  const [eventId, setEventId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [drafting, startDraft] = useTransition();
  const [saving, startSave] = useTransition();

  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const field = "w-full rounded-[8px] border-2 border-rule bg-surface p-2 text-body-sm";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={drafting}
          onClick={() => {
            setMessage(null);
            startDraft(async () => {
              const result = await draftPlainLanguage(classificationId);
              if (!result.ok) {
                setIsError(true);
                setMessage(result.error === "limit" ? t("ai.limit") : t("ai.unavailable"));
                toast.error(result.error === "limit" ? t("ai.limit") : t("ai.unavailable"));
                return;
              }
              setIsError(false);
              setEventId(result.eventId);
              setSummary(result.draft.summary);
              setDayToDay(result.draft.dayToDay.join("\n"));
              setNeed(result.draft.whatYouNeed.join("\n"));
            });
          }}
          className="inline-flex min-h-[44px] items-center gap-[6px] rounded-[8px] bg-line-tint px-3 text-caption font-extrabold text-line-ink disabled:opacity-60"
        >
          <Icon icon={SparkleIcon} weight="duotone" size={20} />
          {drafting ? t("ai.drafting") : t("ai.generatePlain")}
        </button>
        <Link href="/about/ai" aria-label={t("common.aiDisclosureLink")} className="inline-flex h-11 w-11 items-center justify-center text-muted">
          <Icon icon={InfoIcon} weight="regular" size={20} />
        </Link>
      </div>
      {eventId ? <p className="text-caption font-bold text-due">{t("ai.plainDraftNote")}</p> : null}

      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-summary`} className="text-caption font-bold">
          {labels.summary}
        </label>
        <textarea id={`${id}-summary`} rows={3} maxLength={320} value={summary} onChange={(e) => setSummary(e.target.value)} className={field} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-day`} className="text-caption font-bold">
            {t("openings.dayToDay")}
          </label>
          <textarea
            id={`${id}-day`}
            rows={5}
            value={dayToDay}
            onChange={(e) => setDayToDay(e.target.value)}
            aria-describedby={`${id}-hint`}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-need`} className="text-caption font-bold">
            {t("openings.whatYouNeed")}
          </label>
          <textarea id={`${id}-need`} rows={5} value={need} onChange={(e) => setNeed(e.target.value)} aria-describedby={`${id}-hint`} className={field} />
        </div>
      </div>
      <p id={`${id}-hint`} className="text-caption text-muted">
        {labels.onePerLine}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || !summary.trim() || lines(dayToDay).length === 0 || lines(need).length === 0}
          onClick={() =>
            startSave(async () => {
              const result = await approvePlainLanguage({ classificationId, summary, dayToDay: lines(dayToDay), whatYouNeed: lines(need) });
              if (!result.ok) {
                setIsError(true);
                setMessage(t("errors.generic"));
                toast.error(t("errors.generic"));
                return;
              }
              if (eventId) await recordAiDecision(eventId, true);
              setEventId(null);
              setIsError(false);
              setMessage(t("ai.plainApproved"));
              toast.success(t("ai.plainApproved"));
              router.refresh();
            })
          }
          className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white disabled:opacity-60"
        >
          {t("ai.approvePlain")}
        </button>
        {eventId ? (
          <button
            type="button"
            onClick={async () => {
              await recordAiDecision(eventId, false);
              setEventId(null);
              setSummary(initial?.summary ?? "");
              setDayToDay((initial?.dayToDay ?? []).join("\n"));
              setNeed((initial?.whatYouNeed ?? []).join("\n"));
            }}
            className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body-sm font-bold outline-rule"
          >
            {t("ai.discard")}
          </button>
        ) : null}
      </div>
      {message ? (
        <p role="status" className={`text-body-sm font-bold ${isError ? "text-due" : "text-ink"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
