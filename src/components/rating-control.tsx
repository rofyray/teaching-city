"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * One skill: a fieldset of four native radio inputs drawn as buttons. Native radios give
 * arrow-key navigation and one tab stop per group without a widget library (Section 9.5).
 */
export function RatingControl({
  id,
  label,
  value,
  lastWeek,
  invalid,
  onChange,
  checkIcon,
}: {
  id: string;
  label: string;
  value?: number;
  lastWeek?: number;
  invalid?: boolean;
  onChange: (level: number) => void;
  /** Server-rendered check mark for the selected level. */
  checkIcon: ReactNode;
}) {
  const t = useTranslations();
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={invalid && !value ? `${id}-error` : undefined}>
      <legend className="mb-2 text-subheading font-extrabold">
        {label}
        {lastWeek ? (
          <span className="mt-[2px] block text-caption font-semibold text-muted">
            {t("rating.lastWeek", { level: t(`levels.${lastWeek}` as "levels.1") })}
          </span>
        ) : null}
      </legend>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((level) => {
          const selected = value === level;
          return (
            <label
              key={level}
              title={t(`levels.help${level}` as "levels.help1")}
              className={cx(
                "flex min-h-12 cursor-pointer items-center justify-center gap-[6px] rounded-[8px] border-2 px-1 text-body-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                selected ? "border-ink bg-ink font-extrabold text-white" : invalid && !value ? "border-due bg-surface text-ink" : "border-rule bg-surface text-ink",
              )}
            >
              <input
                type="radio"
                name={id}
                value={level}
                checked={selected}
                onChange={() => onChange(level)}
                aria-label={t(`levels.${level}` as "levels.1")}
                className="sr-only"
              />
              {selected ? checkIcon : null}
              <span aria-hidden="true">{t(`levels.short${level}` as "levels.short1")}</span>
            </label>
          );
        })}
      </div>
      {invalid && !value ? (
        <p id={`${id}-error`} className="text-caption font-bold text-due">
          {t("rating.missing")}
        </p>
      ) : null}
    </fieldset>
  );
}
