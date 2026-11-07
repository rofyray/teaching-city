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
} from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { NavLink } from "./nav-link";

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

/**
 * Signed-in shell, rendered on the server so icons ship as HTML, not JavaScript.
 * Desktop (1024px and up): ink top bar with brand, nav and actions.
 * Mobile: a bottom tab bar when `tabs` is set (student and mentor), otherwise a scrolling top nav.
 */
export async function AppShell({
  items,
  tabs = false,
  line,
  brand,
  actions,
  children,
}: {
  items: NavItem[];
  tabs?: boolean;
  line?: string;
  brand: string;
  actions: ReactNode;
  children: ReactNode;
}) {
  const t = await getTranslations("common");
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
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    exact={item.exact}
                    className="inline-flex min-h-[44px] items-center text-body-sm font-semibold text-sign-muted no-underline hover:text-white aria-[current=page]:font-extrabold aria-[current=page]:text-white aria-[current=page]:shadow-[inset_0_-3px_0_var(--tc-line)]"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">{actions}</div>
        </div>
        {!tabs ? (
          <nav aria-label="Main" className="overflow-x-auto lg:hidden">
            <ul className="flex gap-1 px-2 pb-2">
              {items.map((item) => (
                <li key={item.href} className="shrink-0">
                  <NavLink
                    href={item.href}
                    exact={item.exact}
                    className="inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-body-sm font-semibold text-sign-muted no-underline aria-[current=page]:bg-white/10 aria-[current=page]:font-extrabold aria-[current=page]:text-white"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
      <main id="main" className={cn("flex flex-1 flex-col", tabs && "pb-[76px] lg:pb-0")}>
        {children}
      </main>
      {tabs ? (
        <nav aria-label="Main" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface lg:hidden">
          <ul className="flex">
            {items.map((item) => (
              <li key={item.href} className="flex-1">
                <NavLink
                  href={item.href}
                  exact={item.exact}
                  className="group flex min-h-[60px] flex-col items-center gap-1 pt-[10px] pb-[14px] text-micro font-semibold text-muted no-underline aria-[current=page]:font-extrabold aria-[current=page]:text-ink aria-[current=page]:shadow-[inset_0_3px_0_var(--tc-line)]"
                >
                  <span className="text-muted group-aria-[current=page]:hidden">
                    <Icon icon={NAV_ICONS[item.icon]} weight="bold" size={24} />
                  </span>
                  <span className="hidden text-line group-aria-[current=page]:block">
                    <Icon icon={NAV_ICONS[item.icon]} weight="fill" size={24} />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
