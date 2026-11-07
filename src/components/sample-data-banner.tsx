"use client";

import { XIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "./icon";

/** Thin ink bar on every page in demo mode. Hiding lasts until the next page load (BR-15). */
export function SampleDataBanner() {
  const t = useTranslations("banner");
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div role="note" className="sign no-print flex items-center gap-2 bg-ink px-4 py-1 text-caption font-bold text-white">
      <p className="flex-1">{t("sample")}</p>
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="-my-1 inline-flex min-h-[44px] items-center gap-1 px-2 text-caption font-bold text-sign-muted underline-offset-2 hover:underline"
      >
        <Icon icon={XIcon} weight="bold" size={14} />
        {t("dismiss")}
      </button>
    </div>
  );
}
