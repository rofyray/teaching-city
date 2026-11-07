import { cn } from "@/lib/cn";

/** Circle in the line color with the line letter. The adjacent text always names the line. */
export function LineBadge({ letter, line, size = 40, className }: { letter: string; line?: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-line={line}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-line font-extrabold text-white", className)}
      style={{ width: size, height: size, fontSize: size / 2, lineHeight: 1 }}
    >
      {letter}
    </span>
  );
}
