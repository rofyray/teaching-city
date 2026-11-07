import type { ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { StatusPill } from "./status-pill";

export type ThisWeekRow = {
  icon: PhosphorIcon;
  label: string;
  value?: ReactNode;
  due?: string;
  href?: string;
};

/** "This week" card: the next item due first on the due tint, then the other rows (Section 9.5). */
export function ThisWeekPanel({ title, rows }: { title: string; rows: ThisWeekRow[] }) {
  return (
    <section aria-labelledby="this-week" className="card overflow-hidden outline-ink">
      <h2 id="this-week" className="px-4 pt-3 pb-[10px] text-body-sm font-extrabold">
        {title}
      </h2>
      <ul>
        {rows.map((row, i) => {
          const inner = (
            <>
              <Icon icon={row.icon} weight={row.due ? "bold" : "regular"} size={22} className={row.due ? "text-due" : "text-muted"} />
              <span className={cn("flex-1 text-body", row.due ? "font-extrabold" : "font-semibold")}>{row.label}</span>
              {row.due ? <StatusPill variant="due">{row.due}</StatusPill> : null}
              {row.value !== undefined ? <span className="tabular text-body font-extrabold">{row.value}</span> : null}
            </>
          );
          const cls = cn(
            "flex min-h-[48px] items-center gap-3 px-4 py-3 text-ink no-underline",
            i > 0 && "border-t border-rule",
            row.due && "bg-due-tint",
          );
          return (
            <li key={row.label} className="anim-rise" style={{ ["--i" as string]: i + 1 }}>
              {row.href ? (
                <Link href={row.href} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
