"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { requestInterview } from "@/server/actions/vendor";

export function RequestInterviewButton({ studentId, studentName, pending }: { studentId: string; studentName: string; pending: boolean }) {
  const t = useTranslations();
  const [sent, setSent] = useState(pending);
  const [error, setError] = useState(false);
  const [busy, startTransition] = useTransition();

  if (sent) {
    return (
      <p role="status" className="inline-flex min-h-[44px] items-center gap-2 text-body-sm font-bold text-muted">
        <Icon icon={CheckIcon} weight="bold" size={18} />
        {t("vendorPortal.requested")}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          startTransition(async () => {
            const result = await requestInterview(studentId);
            if (result.ok || result.error === "pending") setSent(true);
            else setError(true);
          })
        }
        className="inline-flex min-h-[44px] items-center justify-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white disabled:opacity-70"
      >
        {t("vendorPortal.request")}
        <span className="sr-only">: {studentName}</span>
      </button>
      {error ? (
        <p role="alert" className="text-caption font-bold text-due">
          {t("errors.generic")}
        </p>
      ) : null}
    </div>
  );
}
