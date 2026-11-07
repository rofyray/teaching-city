"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { saveEvidence } from "@/server/actions/mentor";
import { toast } from "@/components/toast";

export function EvidenceEditor({
  enrollmentId,
  firstName,
  rows,
}: {
  enrollmentId: string;
  firstName: string;
  rows: { competencyId: string; label: string; sentence: string }[];
}) {
  const t = useTranslations();
  const id = useId();
  const [values, setValues] = useState(Object.fromEntries(rows.map((r) => [r.competencyId, r.sentence])));
  const [status, setStatus] = useState<Record<string, "saved" | "error" | undefined>>({});
  const [pending, startTransition] = useTransition();
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((r) => {
        const value = values[r.competencyId] ?? "";
        const tooLong = value.length > 200;
        return (
          <li key={r.competencyId} className="flex flex-col gap-2 border-t border-rule pt-4 first:border-t-0 first:pt-0">
            <label htmlFor={`${id}-${r.competencyId}`} className="text-body-sm font-extrabold">
              {r.label}
              <span className="block text-caption font-semibold text-muted">{t("mentor.evidenceLabel", { firstName })}</span>
            </label>
            <textarea
              id={`${id}-${r.competencyId}`}
              rows={2}
              value={value}
              aria-invalid={tooLong || undefined}
              aria-describedby={`${id}-${r.competencyId}-msg`}
              onChange={(e) => setValues((v) => ({ ...v, [r.competencyId]: e.target.value }))}
              className="rounded-[8px] border-2 border-rule bg-surface p-2 text-body-sm"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={pending || tooLong}
                onClick={() =>
                  startTransition(async () => {
                    const result = await saveEvidence(enrollmentId, r.competencyId, value);
                    setStatus((s) => ({ ...s, [r.competencyId]: result.ok ? "saved" : "error" }));
                    toast[result.ok ? "success" : "error"](result.ok ? t("common.saved") : t("errors.generic"));
                  })
                }
                className="inline-flex min-h-[44px] items-center rounded-[8px] bg-surface px-3 text-body-sm font-bold outline-rule disabled:opacity-60"
              >
                {t("common.save")}
              </button>
              <span id={`${id}-${r.competencyId}-msg`} role="status" className="text-caption font-bold text-muted">
                {tooLong ? t("errors.generic") : status[r.competencyId] === "saved" ? t("common.saved") : status[r.competencyId] === "error" ? t("errors.generic") : `${value.length} / 200`}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
