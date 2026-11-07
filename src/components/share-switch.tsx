"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type ReactNode } from "react";
import { setSharing } from "@/server/actions/sharing";
import { Modal } from "./modal";
import { toast } from "./toast";

type ShareType = "share_city_hr" | "share_vendor_bridge" | "public_link";

function ShareSwitch({
  label,
  checked,
  disabled,
  onChange,
  help,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  help?: string;
}) {
  const id = useId();
  return (
    <div className="border-t border-rule py-3 first:border-t-0">
      <div className="flex min-h-[48px] items-center justify-between gap-3">
        <label htmlFor={id} className="text-body font-bold">
          {label}
        </label>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          aria-describedby={help ? `${id}-help` : undefined}
          className="relative h-7 w-12 shrink-0 rounded-full bg-future aria-checked:bg-line disabled:opacity-70"
        >
          <span
            aria-hidden="true"
            className={`block h-[22px] w-[22px] rounded-full bg-surface ${checked ? "translate-x-[23px]" : "translate-x-[3px]"}`}
          />
        </button>
      </div>
      {help ? (
        <p id={`${id}-help`} className="text-caption text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function SharingControls({
  initial,
  icons,
}: {
  initial: Record<ShareType, boolean>;
  /** Server-rendered icons, so they ship as HTML rather than JavaScript. */
  icons: { link: ReactNode; copy: ReactNode };
}) {
  const t = useTranslations("sharing");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const [state, setState] = useState(initial);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function apply(type: ShareType, next: boolean) {
    const previous = state[type];
    setState((s) => ({ ...s, [type]: next }));
    startTransition(async () => {
      const result = await setSharing(type, next);
      if (!result.ok) {
        setState((s) => ({ ...s, [type]: previous }));
        toast.error(te("generic"));
        return;
      }
      if (type === "public_link" && next) toast.success(t("linkCreated"));
      else toast.success(tc("saved"));
      if (type === "public_link") {
        setLink(next && result.url ? `${window.location.origin}${result.url}` : null);
        setCopied(false);
      }
    });
  }

  return (
    <div>
      <ShareSwitch
        label={t("cityHr")}
        checked={state.share_city_hr}
        disabled={pending}
        onChange={(next) => (next ? apply("share_city_hr", true) : setConfirmOpen(true))}
      />
      <ShareSwitch
        label={t("vendors")}
        checked={state.share_vendor_bridge}
        disabled={pending}
        onChange={(next) => apply("share_vendor_bridge", next)}
        help={t("vendorsHelp")}
      />
      <ShareSwitch label={t("link")} checked={state.public_link} disabled={pending} onChange={(next) => apply("public_link", next)} />
      {state.public_link ? (
        <div className="flex flex-col gap-2 pb-2">
          {link ? (
            <>
              <p role="status" className="text-caption font-bold text-ink">
                {t("linkCreated")}
              </p>
              <p className="flex items-center gap-2 break-all text-caption text-muted">
                {icons.link}
                {link}
              </p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  toast.success(t("copied"));
                }}
                className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-[8px] px-3 text-body-sm font-bold outline-rule"
              >
                {icons.copy}
                <span aria-live="polite">{copied ? t("copied") : t("copyLink")}</span>
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => apply("public_link", false)}
            className="inline-flex min-h-[44px] items-center self-start text-body-sm font-bold text-due underline"
          >
            {t("revokeLink")}
          </button>
        </div>
      ) : null}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={t("cityHrOffTitle")} description={t("cityHrOffBody")}>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body font-bold outline-rule"
          >
            {tc("cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmOpen(false);
              apply("share_city_hr", false);
            }}
            className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body font-extrabold text-white"
          >
            {t("cityHrOffConfirm")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
