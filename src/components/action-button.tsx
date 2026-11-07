"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { cx } from "@/lib/cx";
import { toast } from "./toast";

/** Runs a bound Server Action and shows the generic error copy if it fails. */
export function ActionButton({
  action,
  label,
  successMessage,
  variant = "secondary",
  className,
}: {
  action: () => Promise<{ ok: boolean } | void>;
  label: string;
  /** Toast shown after the action succeeds. */
  successMessage?: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const result = await action();
              const ok = result ? result.ok : true;
              setFailed(!ok);
              if (!ok) toast.error(t("generic"));
              else if (successMessage) toast.success(successMessage);
            } catch {
              setFailed(true);
              toast.error(t("generic"));
            }
          })
        }
        className={cx(
          "inline-flex min-h-[44px] items-center justify-center rounded-[8px] px-3 text-body-sm font-bold disabled:opacity-70",
          variant === "primary" ? "bg-ink font-extrabold text-white" : "bg-surface text-ink outline-rule",
          className,
        )}
      >
        {label}
      </button>
      {failed ? (
        <span role="alert" className="text-caption font-bold text-due">
          {t("generic")}
        </span>
      ) : null}
    </span>
  );
}
