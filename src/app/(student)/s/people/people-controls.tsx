"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { askReference, setQuoteHidden } from "@/server/actions/student";

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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="inline-flex min-h-[44px] items-center rounded-[8px] bg-surface px-3 text-body-sm font-bold outline-rule">
        {t("people.ask")}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-[8px] bg-surface p-6">
          <Dialog.Title className="text-heading font-extrabold">{t("people.askConfirm", { name })}</Dialog.Title>
          <Dialog.Description className="sr-only">{t("people.ask")}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close className="min-h-[44px] rounded-[8px] px-4 text-body font-bold outline-rule">{t("common.cancel")}</Dialog.Close>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await askReference(refereeId);
                  setOpen(false);
                  setMessage(r.ok ? t("people.askSent", { name }) : t("errors.generic"));
                })
              }
              className="min-h-[44px] rounded-[8px] bg-ink px-4 text-body font-extrabold text-white disabled:opacity-70"
            >
              {t("people.ask")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function QuoteToggle({ referenceId, hidden }: { referenceId: string; hidden: boolean }) {
  const t = useTranslations("people");
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
        })
      }
      className="inline-flex min-h-[44px] items-center self-start text-body-sm font-bold underline disabled:opacity-70"
    >
      {value ? t("showQuote") : t("hideQuote")}
    </button>
  );
}
