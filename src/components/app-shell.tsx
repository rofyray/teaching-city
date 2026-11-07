"use client";

import {
  BriefcaseIcon,
  BuildingsIcon,
  CalendarCheckIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  CurrencyDollarIcon,
  GraduationCapIcon,
  HandshakeIcon,
  PathIcon,
  SealCheckIcon,
  SignpostIcon,
  SquaresFourIcon,
  UsersThreeIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export const NAV_ICONS = {
  route: PathIcon,
  transcript: SealCheckIcon,
  people: UsersThreeIcon,
  openings: BriefcaseIcon,
  students: UsersThreeIcon,
  meetings: CalendarCheckIcon,
  references: SealCheckIcon,
  overview: SquaresFourIcon,
  units: BuildingsIcon,
  matching: SignpostIcon,
  classifications: ClipboardTextIcon,
  pool: HandshakeIcon,
  vendors: HandshakeIcon,
  outcomes: ChartLineUpIcon,
  budget: CurrencyDollarIcon,
  college: GraduationCapIcon,
} satisfies Record<string, PhosphorIcon>;

export type NavItem = { href: string; label: string; icon: keyof typeof NAV_ICONS; exact?: boolean };

function isCurrent(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Signed-in shell. Desktop (1024px and up): ink top bar with brand, nav and actions.
 * Mobile: a bottom tab bar when `tabs` is set (student and mentor), otherwise a scrolling top nav.
 */
export function AppShell({
  items,
  tabs = false,
  line,
  brand,
  actions,
  children,
  hideMobileChrome = false,
}: {
  items: NavItem[];
  tabs?: boolean;
  line?: string;
  brand: string;
  actions: ReactNode;
  children: ReactNode;
  hideMobileChrome?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("common");
  return (
    <div data-line={line} className="flex min-h-full flex-1 flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3">
        {t("skipToContent")}
      </a>
      <div className={cn("sign no-print bg-ink text-white", tabs ? "hidden lg:block" : "block")}>
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-2 lg:px-10">
          <Link href={items[0]?.href ?? "/"} className="flex min-h-[44px] items-center gap-2 font-extrabold text-white no-underline">
            <Icon icon={SignpostIcon} weight="bold" size={22} />
            {brand}
          </Link>
          <nav aria-label="Main" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-6">
              {items.map((item) => {
                const current = isCurrent(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-[44px] items-center text-body-sm font-semibold text-sign-muted no-underline hover:text-white",
                        current && "font-extrabold text-white shadow-[inset_0_-3px_0_var(--tc-line)]",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className={cn("flex items-center gap-1", "ml-auto lg:ml-0")}>{actions}</div>
        </div>
        {!tabs ? (
          <nav aria-label="Main" className="overflow-x-auto lg:hidden">
            <ul className="flex gap-1 px-2 pb-2">
              {items.map((item) => {
                const current = isCurrent(pathname, item);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-body-sm font-semibold text-sign-muted no-underline",
                        current && "bg-white/10 font-extrabold text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </div>
      <main id="main" className={cn("flex flex-1 flex-col", tabs && !hideMobileChrome && "pb-[76px] lg:pb-0")}>
        {children}
      </main>
      {tabs && !hideMobileChrome ? <TabBar items={items} pathname={pathname} /> : null}
    </div>
  );
}

function TabBar({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface lg:hidden">
      <ul className="flex">
        {items.map((item) => {
          const current = isCurrent(pathname, item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-[60px] flex-col items-center gap-1 pt-[10px] pb-[14px] text-micro font-semibold text-muted no-underline",
                  current && "font-extrabold text-ink shadow-[inset_0_3px_0_var(--tc-line)]",
                )}
              >
                <Icon icon={NAV_ICONS[item.icon]} weight={current ? "fill" : "bold"} size={24} className={current ? "text-line" : "text-muted"} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
