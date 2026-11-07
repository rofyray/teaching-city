"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { BUDGET_DEFAULTS, pilotBudget, type BudgetInput } from "@/domain/metrics";

const FIELDS: { key: keyof BudgetInput; label: "students" | "weeks" | "hours" | "rate" | "coordinator" | "platform"; money?: boolean; step?: number }[] = [
  { key: "students", label: "students" },
  { key: "weeks", label: "weeks" },
  { key: "hours", label: "hours", step: 0.5 },
  { key: "rateDollars", label: "rate", money: true, step: 0.5 },
  { key: "coordinator", label: "coordinator", money: true, step: 1000 },
  { key: "platform", label: "platform", money: true, step: 500 },
];

export function PilotCalculator() {
  const t = useTranslations("pilot");
  const locale = useLocale();
  const id = useId();
  const [raw, setRaw] = useState<Record<keyof BudgetInput, string>>(
    Object.fromEntries(Object.entries(BUDGET_DEFAULTS).map(([k, v]) => [k, String(v)])) as Record<keyof BudgetInput, string>,
  );
  const values = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Math.max(0, Number(v) || 0)])) as BudgetInput;
  const result = pilotBudget(values);
  const money = (n: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <fieldset className="card p-5">
        <legend className="sr-only">{t("assumptions")}</legend>
        <h2 className="text-heading font-extrabold">{t("assumptions")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label htmlFor={`${id}-${f.key}`} className="text-body-sm font-bold">
                {t(f.label)}
              </label>
              <div className="flex items-center gap-2">
                {f.money ? <span aria-hidden="true" className="text-body font-bold text-muted">$</span> : null}
                <input
                  id={`${id}-${f.key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={f.step ?? 1}
                  value={raw[f.key]}
                  onChange={(e) => setRaw((r) => ({ ...r, [f.key]: e.target.value }))}
                  className="tabular min-h-[44px] w-full rounded-[8px] border-2 border-rule bg-surface px-2 text-body"
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      <section aria-live="polite" className="card flex flex-col gap-4 p-5 outline-ink">
        <div>
          <p className="text-body-sm font-bold text-muted">{t("wages")}</p>
          <p className="tabular text-title font-extrabold">{money(result.wages)}</p>
        </div>
        <div>
          <p className="text-body-sm font-bold text-muted">{t("perStudent")}</p>
          <p className="tabular text-title font-extrabold">{money(result.perStudent)}</p>
        </div>
        <div className="border-t border-rule pt-4">
          <p className="text-body-sm font-bold text-muted">{t("total")}</p>
          <p className="tabular text-display font-extrabold">{money(result.total)}</p>
        </div>
      </section>
    </div>
  );
}
