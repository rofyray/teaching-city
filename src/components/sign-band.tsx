import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LineBadge } from "./line-badge";

type Props = {
  title: string;
  subtitle?: string;
  letter?: string;
  line?: string;
  /** Left slot, used for a back link on task screens. */
  leading?: ReactNode;
  /** Right slot, a 44px action such as the notification bell. */
  action?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
};

/** Ink band with white type, like station signage (Section 9.1). */
export function SignBand({ title, subtitle, letter, line, leading, action, as: Heading = "h1", className }: Props) {
  return (
    <header data-line={line} className={cn("sign print-sign flex items-center gap-3 bg-ink py-4 pr-4 pl-5 text-white", className)}>
      {leading}
      {letter ? <LineBadge letter={letter} line={line} /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <Heading className="text-title font-extrabold">{title}</Heading>
        {subtitle ? <p className="text-caption text-sign-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
