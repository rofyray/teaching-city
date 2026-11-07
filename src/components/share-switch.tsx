"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { CopyIcon, LinkIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { setSharing } from "@/server/actions/sharing";
import { Icon } from "./icon";
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
        <Switch.Root
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onChange}
          aria-describedby={help ? `${id}-help` : undefined}
          className="relative h-7 w-12 shrink-0 rounded-full bg-future data-[state=checked]:bg-line disabled:opacity-70"
        >
          <Switch.Thumb className="block h-[22px] w-[22px] translate-x-[3px] rounded-full bg-surface data-[state=checked]:translate-x-[23px]" />
        </Switch.Root>
      </div>
      {help ? (
        <p id={`${id}-help`} className="text-caption text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export function SharingControls({ initial }: { initial: Record<ShareType, boolean> }) {
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
                <Icon icon={LinkIcon} weight="bold" size={16} />
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
                <Icon icon={CopyIcon} weight="bold" size={18} />
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

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-[8px] bg-surface p-6">
            <Dialog.Title className="text-heading font-extrabold">{t("cityHrOffTitle")}</Dialog.Title>
            <Dialog.Description className="mt-3 text-body text-muted">{t("cityHrOffBody")}</Dialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Dialog.Close className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body font-bold outline-rule">
                {tc("cancel")}
              </Dialog.Close>
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
