"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { CheckIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/** One skill: a radio group of four levels with arrow-key navigation (Section 9.5). */
export function RatingControl({
  id,
  label,
  value,
  lastWeek,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  value?: number;
  lastWeek?: number;
  invalid?: boolean;
  onChange: (level: number) => void;
}) {
  const t = useTranslations();
  const legendId = `${id}-legend`;
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={invalid ? `${id}-error` : undefined}>
      <legend id={legendId} className="mb-2 text-subheading font-extrabold">
        {label}
        {lastWeek ? (
          <span className="mt-[2px] block text-caption font-semibold text-muted">
            {t("rating.lastWeek", { level: t(`levels.${lastWeek}` as "levels.1") })}
          </span>
        ) : null}
      </legend>
      <RadioGroup.Root
        aria-labelledby={legendId}
        value={value ? String(value) : ""}
        onValueChange={(v) => onChange(Number(v))}
        orientation="horizontal"
        loop
        className="grid grid-cols-4 gap-2"
      >
        {[1, 2, 3, 4].map((level) => {
          const selected = value === level;
          return (
            <RadioGroup.Item
              key={level}
              value={String(level)}
              aria-label={t(`levels.${level}` as "levels.1")}
              title={t(`levels.help${level}` as "levels.help1")}
              className={cn(
                "flex min-h-12 items-center justify-center gap-[6px] rounded-[8px] border-2 px-1 text-body-sm font-semibold",
                selected ? "border-ink bg-ink font-extrabold text-white" : "border-rule bg-surface text-ink",
                invalid && !value && "border-due",
              )}
            >
              {selected ? <Icon icon={CheckIcon} weight="bold" size={16} /> : null}
              <span aria-hidden="true">{t(`levels.short${level}` as "levels.short1")}</span>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
      {invalid && !value ? (
        <p id={`${id}-error`} className="text-caption font-bold text-due">
          {t("rating.missing")}
        </p>
      ) : null}
    </fieldset>
  );
}
