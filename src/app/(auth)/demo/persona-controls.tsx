"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { resetDemoData, signInAsPersona } from "@/server/actions/demo";
import { toast } from "@/components/toast";

export function PersonaButton({ personaKey, label }: { personaKey: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signInAsPersona(personaKey))}
      className="inline-flex min-h-[48px] items-center justify-center rounded-[8px] bg-ink px-4 text-body font-extrabold text-white disabled:opacity-70"
    >
      {label}
    </button>
  );
}

export function ResetDemoButton() {
  const t = useTranslations("demo");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await resetDemoData();
            setMessage(result.status === "done" ? t("resetDone") : t("resetWait"));
            if (result.status === "done") toast.success(t("resetDone"));
            else toast.info(t("resetWait"));
          })
        }
        className="inline-flex min-h-[44px] items-center rounded-[8px] bg-surface px-4 text-body font-bold text-ink outline-ink disabled:opacity-70"
      >
        {t("reset")}
      </button>
      <p role="status" aria-live="polite" className="text-body-sm text-muted">
        {message}
      </p>
    </div>
  );
}
