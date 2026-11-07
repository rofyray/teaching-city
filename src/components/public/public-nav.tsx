"use client";

import { ListIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Icon } from "@/components/icon";
import { cx } from "@/lib/cx";

const LINKS = [
  { href: "/how-it-works", key: "howItWorks" },
  { href: "/demo", key: "tryDemo" },
] as const;

/** Public site navigation. Collapses to a menu button under 640px (P3.1). */
export function PublicNav() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const items = (mobile: boolean) =>
    LINKS.map((link) => {
      const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
      return (
        <li key={link.href}>
          <Link
            href={link.href}
            aria-current={current ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={cx(
              "flex min-h-[44px] items-center text-body-sm font-bold no-underline",
              mobile ? "px-5" : "rounded-[8px] px-4",
              !mobile && link.key === "tryDemo"
                ? "ml-2 bg-white px-5 text-ink hover:bg-ground"
                : current
                  ? cx("bg-white/15 text-white", mobile && "shadow-[inset_4px_0_0_var(--tc-line-finance)]")
                  : "text-sign-muted hover:bg-white/5 hover:text-white",
            )}
          >
            {t(link.key)}
          </Link>
        </li>
      );
    });

  return (
    <>
      <nav aria-label={tc("appName")} className="hidden sm:block">
        <ul className="flex items-center">{items(false)}</ul>
      </nav>
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center text-white sm:hidden"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={tc("menu")}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon icon={open ? XIcon : ListIcon} weight="bold" size={24} />
      </button>
      <nav
        id={menuId}
        aria-label={tc("appName")}
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 border-t border-white/20 bg-ink pb-3 sm:hidden"
      >
        <ul className="flex flex-col">{items(true)}</ul>
      </nav>
    </>
  );
}
