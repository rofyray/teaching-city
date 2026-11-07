"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { updateInterview } from "@/server/actions/vendor";

export function InterviewForm({
  interestId,
  interviewAt,
  outcome,
  outcomeNoneLabel,
}: {
  interestId: string;
  /** Program-time value for a datetime-local input, or "". */
  interviewAt: string;
  outcome: "none" | "offer" | "no_offer";
  outcomeNoneLabel: string;
}) {
  const t = useTranslations();
  const id = useId();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      action={(form) =>
        startTransition(async () => {
          const result = await updateInterview({
            interestId,
            interviewAt: String(form.get("interviewAt") ?? ""),
            outcome: String(form.get("outcome") ?? "none") as "none",
          });
          setStatus(result.ok ? "saved" : "error");
        })
      }
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-date`} className="text-caption font-bold text-muted">
          {t("openingsAdmin.interview")}
        </label>
        <input
          id={`${id}-date`}
          name="interviewAt"
          type="datetime-local"
          defaultValue={interviewAt}
          className="min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-2 text-body-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-outcome`} className="text-caption font-bold text-muted">
          {t("vendorPortal.outcome")}
        </label>
        <select
          id={`${id}-outcome`}
          name="outcome"
          defaultValue={outcome}
          className="min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-2 text-body-sm"
        >
          <option value="none">{outcomeNoneLabel}</option>
          <option value="offer">{t("vendorPortal.outcomeOffer")}</option>
          <option value="no_offer">{t("vendorPortal.outcomeNoOffer")}</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white disabled:opacity-70"
      >
        {t("common.save")}
      </button>
      <p role="status" aria-live="polite" className="min-h-[20px] text-caption font-bold text-muted">
        {status === "saved" ? t("common.saved") : status === "error" ? t("errors.generic") : null}
      </p>
    </form>
  );
}
