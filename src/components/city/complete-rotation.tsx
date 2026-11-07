"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { completeRotation } from "@/server/actions/city";

export function CompleteRotation({ enrollmentId, early, weeks, name }: { enrollmentId: string; early: boolean; weeks: number; name: string }) {
  const t = useTranslations();
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-body-sm font-bold outline-rule"
      >
        {t("city.completeRotation")}
        <span className="sr-only">: {name}</span>
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (early && !reason.trim()) {
          setError(t("city.completeEarly", { week: weeks }));
          return;
        }
        start(async () => {
          const result = await completeRotation(enrollmentId, reason);
          if (!result.ok) setError(result.error === "reason" ? t("city.completeEarly", { week: weeks }) : t("errors.generic"));
          else router.refresh();
        });
      }}
    >
      {early ? (
        <>
          <p id={`${id}-help`} className="text-caption text-muted">
            {t("city.completeEarly", { week: weeks })}
          </p>
          <label htmlFor={`${id}-reason`} className="text-caption font-bold">
            {t("city.reasonLabel")}
          </label>
          <input
            id={`${id}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : `${id}-help`}
            className="min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-2 text-body-sm"
          />
        </>
      ) : null}
      {error ? (
        <p id={`${id}-err`} className="text-caption font-bold text-due">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-3 text-body-sm font-extrabold text-white disabled:opacity-70">
          {t("city.completeRotation")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-body-sm font-bold outline-rule">
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
