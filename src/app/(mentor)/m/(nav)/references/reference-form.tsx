"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { respondReference } from "@/server/actions/mentor";

export function ReferenceForm({ referenceId, firstName }: { referenceId: string; firstName: string }) {
  const t = useTranslations();
  const id = useId();
  const [quote, setQuote] = useState("");
  const [approve, setApprove] = useState(true);
  const [result, setResult] = useState<"confirmed" | "declined" | "error" | null>(null);
  const [pending, startTransition] = useTransition();

  const send = (decision: "confirm" | "decline") =>
    startTransition(async () => {
      const r = await respondReference({ referenceId, decision, quote, approveQuote: approve });
      setResult(r.ok ? (decision === "confirm" ? "confirmed" : "declined") : "error");
    });

  if (result === "confirmed" || result === "declined") {
    return (
      <p role="status" className="mt-2 text-body-sm font-bold">
        {result === "confirmed" ? t("references.confirmed", { firstName }) : t("people.declined")}
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <label htmlFor={`${id}-q`} className="text-body-sm font-bold">
        {t("references.quoteLabel", { firstName })}
      </label>
      <textarea
        id={`${id}-q`}
        rows={2}
        maxLength={240}
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        aria-describedby={`${id}-help`}
        className="rounded-[8px] border-2 border-rule bg-surface p-2 text-body-sm"
      />
      <p id={`${id}-help`} className="text-caption text-muted">
        {t("references.quoteHelp")}
      </p>
      <label className="flex min-h-[44px] items-center gap-2 text-body-sm font-semibold">
        <input type="checkbox" checked={approve} onChange={(e) => setApprove(e.target.checked)} className="h-5 w-5" />
        {t("references.approveQuote")}
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => send("confirm")} className="min-h-[44px] rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white disabled:opacity-70">
          {t("references.confirm")}
        </button>
        <button type="button" disabled={pending} onClick={() => send("decline")} className="min-h-[44px] rounded-[8px] bg-surface px-4 text-body-sm font-bold outline-rule disabled:opacity-70">
          {t("references.decline")}
        </button>
      </div>
      {result === "error" ? (
        <p role="alert" className="text-caption font-bold text-due">
          {t("errors.generic")}
        </p>
      ) : null}
    </div>
  );
}
