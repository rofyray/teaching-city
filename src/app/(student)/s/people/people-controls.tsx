"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { askReference, setQuoteHidden } from "@/server/actions/student";
import { Modal } from "@/components/modal";
import { toast } from "@/components/toast";

export function AskReferenceButton({ refereeId, name }: { refereeId: string; name: string }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (message) {
    return (
      <p role="status" className="text-body-sm font-bold">
        {message}
      </p>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center rounded-[8px] bg-surface px-3 text-body-sm font-bold outline-rule"
      >
        {t("people.ask")}
        <span className="sr-only">: {name}</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("people.askConfirm", { name })}>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] rounded-[8px] px-4 text-body font-bold outline-rule">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await askReference(refereeId);
                setOpen(false);
                setMessage(r.ok ? t("people.askSent", { name }) : t("errors.generic"));
                toast[r.ok ? "success" : "error"](r.ok ? t("people.askSent", { name }) : t("errors.generic"));
              })
            }
            className="min-h-[44px] rounded-[8px] bg-ink px-4 text-body font-extrabold text-white disabled:opacity-70"
          >
            {t("people.ask")}
          </button>
        </div>
      </Modal>
    </>
  );
}

export function QuoteToggle({ referenceId, hidden }: { referenceId: string; hidden: boolean }) {
  const t = useTranslations("people");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const [value, setValue] = useState(hidden);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={value}
      onClick={() =>
        startTransition(async () => {
          const r = await setQuoteHidden(referenceId, !value);
          if (r.ok) setValue(!value);
          toast[r.ok ? "success" : "error"](r.ok ? tc("saved") : te("generic"));
        })
      }
      className="inline-flex min-h-[44px] items-center self-start text-body-sm font-bold underline disabled:opacity-70"
    >
      {value ? t("showQuote") : t("hideQuote")}
    </button>
  );
}
