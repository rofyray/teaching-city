"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { setActiveRole, setLocale, signOut } from "@/server/actions/account";
import type { Role } from "@/server/db/schema";

const itemClass =
  "flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-[6px] px-3 text-left text-body-sm font-semibold text-ink hover:bg-ground focus-visible:bg-ground";

/** Account disclosure: role switcher, language and sign out. A plain button and panel, no menu library. */
export type AccountMenuIcons = { user: ReactNode; switchRole: ReactNode; language: ReactNode; check: ReactNode; settings: ReactNode; signOut: ReactNode };

export function AccountMenu({
  name,
  roles,
  activeRole,
  locale,
  settingsHref,
  icons,
}: {
  /** Icons rendered on the server and passed in, so they ship as HTML rather than JavaScript. */
  icons: AccountMenuIcons;
  name: string;
  roles: Role[];
  activeRole: Role | null;
  locale: "en" | "es";
  settingsHref?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const run = (fn: () => Promise<unknown>) => {
    setOpen(false);
    startTransition(async () => {
      await fn();
    });
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={name}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
      >
        {icons.user}
      </button>
      <div
        id={`${id}-panel`}
        hidden={!open}
        className="absolute top-12 right-0 z-50 min-w-[240px] rounded-[8px] bg-surface p-1 text-ink outline-rule"
      >
        <p className="px-3 py-2 text-caption font-bold text-muted">{name}</p>
        {roles.length > 1 ? (
          <>
            <p className="flex items-center gap-2 px-3 pt-2 pb-1 text-micro font-extrabold text-muted">
              {icons.switchRole}
              {t("common.switchRole")}
            </p>
            <ul>
              {roles.map((role) => (
                <li key={role}>
                  <button type="button" aria-pressed={role === activeRole} className={itemClass} onClick={() => run(() => setActiveRole(role))}>
                    <span className="w-4">{role === activeRole ? icons.check : null}</span>
                    {t(`roles.${role}`)}
                  </button>
                </li>
              ))}
            </ul>
            <hr className="my-1 border-rule" />
          </>
        ) : null}
        <p className="flex items-center gap-2 px-3 pt-2 pb-1 text-micro font-extrabold text-muted">
          {icons.language}
          {t("common.language")}
        </p>
        <ul>
          {(["en", "es"] as const).map((l) => (
            <li key={l}>
              <button
                type="button"
                lang={l}
                aria-pressed={l === locale}
                className={itemClass}
                onClick={() =>
                  run(async () => {
                    await setLocale(l);
                    router.refresh();
                  })
                }
              >
                <span className="w-4">{l === locale ? icons.check : null}</span>
                {l === "en" ? t("common.english") : t("common.spanish")}
              </button>
            </li>
          ))}
        </ul>
        <hr className="my-1 border-rule" />
        {settingsHref ? (
          <Link href={settingsHref} onClick={() => setOpen(false)} className={`${itemClass} no-underline`}>
            {icons.settings}
            {t("nav.settings")}
          </Link>
        ) : null}
        <button type="button" className={itemClass} onClick={() => run(() => signOut())}>
          {icons.signOut}
          {t("common.signOut")}
        </button>
      </div>
    </div>
  );
}
