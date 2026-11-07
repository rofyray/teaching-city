"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The only client part of the navigation: marks the current page. Styles key off aria-current. */
export function NavLink({ href, exact, className, children }: { href: string; exact?: boolean; className?: string; children: ReactNode }) {
  const pathname = usePathname();
  const current = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
