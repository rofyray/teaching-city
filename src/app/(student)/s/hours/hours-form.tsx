"use client";

import { MinusIcon, PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { formatMoney, validateHours } from "@/domain/rules";
import { saveHours } from "@/server/actions/student";
import { toast } from "@/components/toast";

export function HoursForm({
  week,
  initialHours,
  initialNote,
  payRateCents,
  maxHours,
}: {
  week: number;
  initialHours: number | null;
  initialNote: string;
  payRateCents: number;
  maxHours: number;
}) {
  const t = useTranslations();
  const id = useId();
  const [value, setValue] = useState(initialHours === null ? "" : String(initialHours));
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const parsed = validateHours(value, maxHours);
  const preview = parsed.ok ? formatMoney(Math.round(parsed.hours * payRateCents)) : null;
  const step = (delta: number) => {
    const current = parsed.ok ? parsed.hours : 0;
    const next = Math.min(maxHours, Math.max(0, current + delta));
    setValue(String(next));
    setSaved(false);
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        if (!parsed.ok) {
          setError(t(`hours.${parsed.error}`));
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await saveHours(week, value, note);
          if (result.ok) {
            setSaved(true);
            toast.success(t("common.saved"));
          } else {
            const message = result.error === "tooMany" || result.error === "notNumber" ? t(`hours.${result.error}`) : t("errors.generic");
            setError(message);
            toast.error(message);
          }
        });
      }}
    >
      <label htmlFor={`${id}-h`} className="text-body font-bold">
        {t("hours.hoursLabel")}
      </label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => step(-0.5)} aria-label={t("hours.decrease")} className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] bg-surface outline-rule">
          <Icon icon={MinusIcon} weight="bold" size={20} />
        </button>
        <input
          id={`${id}-h`}
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-preview${error ? ` ${id}-err` : ""}`}
          className="tabular h-12 w-24 rounded-[8px] border-2 border-rule bg-surface px-3 text-center text-heading font-extrabold"
        />
        <button type="button" onClick={() => step(0.5)} aria-label={t("hours.increase")} className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] bg-surface outline-rule">
          <Icon icon={PlusIcon} weight="bold" size={20} />
        </button>
        <span className="text-body-sm text-muted">{t("common.hoursOf", { hours: "", max: maxHours }).trim()}</span>
      </div>
      {error ? (
        <p id={`${id}-err`} className="flex items-center gap-2 text-body-sm font-semibold text-due">
          <Icon icon={WarningCircleIcon} weight="bold" size={18} />
          {error}
        </p>
      ) : null}
      <p id={`${id}-preview`} className="text-body-sm text-muted" aria-live="polite">
        {preview ? t("hours.earningsPreview", { amount: preview }) : null}
      </p>
      <label htmlFor={`${id}-n`} className="text-body-sm font-bold">
        {t("hours.noteLabel")}
      </label>
      <textarea id={`${id}-n`} value={note} maxLength={300} rows={2} onChange={(e) => setNote(e.target.value)} className="rounded-[8px] border-2 border-rule bg-surface p-2 text-body-sm" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="min-h-[48px] rounded-[8px] bg-ink px-5 text-body font-extrabold text-white disabled:opacity-70">
          {t("hours.save")}
        </button>
        <span role="status" className="text-body-sm font-bold text-muted">
          {saved ? t("common.saved") : null}
        </span>
      </div>
    </form>
  );
}
