import { getLocale, getTranslations } from "next-intl/server";
import { StatusPill, type PillVariant } from "@/components/status-pill";
import { CITY_COPY, METRIC_COPY, pick } from "@/content/city-copy";
import { METRIC_ORDER, type MetricResult } from "@/domain/metrics";

const STATUS: Record<MetricResult["status"], { key: "onTarget" | "belowTarget" | "inProgress" | "notMeasured" | "fewerThanFive"; variant: PillVariant }> = {
  on_target: { key: "onTarget", variant: "confirmed" },
  below_target: { key: "belowTarget", variant: "due" },
  in_progress: { key: "inProgress", variant: "neutral" },
  not_measured: { key: "notMeasured", variant: "asked" },
  fewer_than_5: { key: "fewerThanFive", variant: "asked" },
};

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));
}

/** One row per metric, in Content Pack 13.5 order. Every number comes from the query. */
export async function OutcomesTable({ metrics }: { metrics: MetricResult[] }) {
  const t = await getTranslations("outcomes");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const byKey = new Map(metrics.map((m) => [m.key, m]));
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {METRIC_ORDER.map((key) => {
        const m = byKey.get(key)!;
        const copy = METRIC_COPY[key];
        const status = STATUS[m.status];
        let value = "";
        if (m.value !== null) {
          if (m.unit === "days") value = fill(pick(CITY_COPY.daysValue, locale), { days: m.value });
          else if (m.unit === "comparison") value = fill(pick(CITY_COPY.vsPeers, locale), { value: m.value.toFixed(1), peer: (m.numerator ?? 0).toFixed(1) });
          else value = `${m.value.toFixed(1)}%`;
        }
        const n = m.unit === "percent" && m.numerator !== null && m.denominator !== null ? tc("of", { count: m.numerator, total: m.denominator }) : m.denominator !== null ? String(m.denominator) : null;
        return (
          <li key={key} className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-subheading font-extrabold">{pick(copy.name, locale)}</h2>
                <p className="text-caption text-muted">{pick(copy.value, locale)}</p>
              </div>
              <StatusPill variant={status.variant}>{t(status.key)}</StatusPill>
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <dt className="text-micro font-extrabold text-muted">{pick(CITY_COPY.value, locale)}</dt>
                <dd className="tabular text-heading font-extrabold">{value || t(status.key)}</dd>
              </div>
              <div>
                <dt className="text-micro font-extrabold text-muted">{pick(CITY_COPY.target, locale)}</dt>
                <dd className="text-body font-bold">{pick(copy.target, locale)}</dd>
              </div>
              {n ? (
                <div>
                  <dt className="text-micro font-extrabold text-muted">n</dt>
                  <dd className="tabular text-body font-bold">{n}</dd>
                </div>
              ) : null}
            </dl>
            <details className="mt-3">
              <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-body-sm font-bold text-focus">{t("howWeCount")}</summary>
              <p className="text-body-sm text-muted">{pick(copy.how, locale)}</p>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

export function CohortFilter({
  terms,
  selected,
  label,
  action,
  submitLabel,
}: {
  terms: string[];
  selected: string;
  label: string;
  action: string;
  submitLabel: string;
}) {
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="cohort" className="text-caption font-bold">
          {label}
        </label>
        <select id="cohort" name="cohort" defaultValue={selected} className="min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-2 text-body-sm">
          {terms.map((term) => (
            <option key={term} value={term}>
              {term}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body-sm font-bold outline-rule">
        {submitLabel}
      </button>
    </form>
  );
}
