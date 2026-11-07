"use client";

import { TranslateIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/server/actions/account";
import { Icon } from "./icon";

export function LanguageSwitch({ locale }: { locale: "en" | "es" }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mb-2 flex items-center gap-2 text-body-sm font-bold text-muted">
        <Icon icon={TranslateIcon} weight="regular" size={18} />
        {t("language")}
      </legend>
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          onClick={() =>
            startTransition(async () => {
              await setLocale(l);
              router.refresh();
            })
          }
          className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body font-bold outline-rule aria-pressed:bg-ink aria-pressed:text-white"
        >
          {l === "en" ? t("english") : t("spanish")}
        </button>
      ))}
    </fieldset>
  );
}
