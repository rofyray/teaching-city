import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PillVariant = "due" | "confirmed" | "asked" | "bar" | "neutral" | "ink" | "level1" | "level2" | "level3" | "level4";

const styles: Record<PillVariant, string> = {
  due: "bg-due-tint text-due",
  confirmed: "bg-line-tint text-line-ink",
  asked: "bg-ground text-muted",
  bar: "bg-level-4 text-white",
  neutral: "bg-ground text-ink",
  ink: "bg-ink text-white",
  level1: "bg-level-1 text-ink",
  level2: "bg-level-2 text-ink",
  level3: "bg-level-3 text-white",
  level4: "bg-level-4 text-white",
};

export function StatusPill({ variant, children, className }: { variant: PillVariant; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-[12px] px-[10px] py-1 text-caption font-extrabold",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
