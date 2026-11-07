import { CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export type Station = { title: string; sub?: string; state: "done" | "here" | "next" };

/** Vertical route: done (filled check), here (thick ring, larger type), next (thin ring, muted). */
export function RouteVertical({ stations, label }: { stations: Station[]; label: string }) {
  return (
    <ol aria-label={label}>
      {stations.map((s, i) => {
        const prev = stations[i - 1];
        const segAbove = i === 0 ? "transparent" : prev.state === "done" ? "var(--tc-line)" : "var(--tc-future)";
        const segBelow = i === stations.length - 1 ? "transparent" : s.state === "done" ? "var(--tc-line)" : "var(--tc-future)";
        return (
          <li key={s.title} className="flex min-h-[64px] gap-[14px]" aria-current={s.state === "here" ? "step" : undefined}>
            <div aria-hidden="true" className="flex w-7 flex-col items-center">
              <div className="anim-draw-y h-[10px] w-[6px]" style={{ background: segAbove, ["--i" as string]: i }} />
              {s.state === "done" ? (
                <span className="rounded-full bg-surface">
                  <Icon icon={CheckCircleIcon} weight="fill" size={24} className="text-line" />
                </span>
              ) : s.state === "here" ? (
                <span className="anim-ping relative block h-[26px] w-[26px] rounded-full bg-surface shadow-[inset_0_0_0_6px_var(--tc-line)]" />
              ) : (
                <span className="block h-[18px] w-[18px] rounded-full bg-surface shadow-[inset_0_0_0_3px_var(--tc-future)]" />
              )}
              <div className="anim-draw-y w-[6px] flex-1" style={{ background: segBelow, ["--i" as string]: i + 0.5 }} />
            </div>
            <div className="flex flex-col gap-[2px] pt-[10px] pb-3">
              <span
                className={cn(
                  s.state === "here" ? "text-heading font-extrabold text-ink" : "text-body font-bold",
                  s.state === "next" ? "text-muted" : "text-ink",
                )}
              >
                {s.title}
              </span>
              {s.sub ? <span className="text-body-sm text-muted">{s.sub}</span> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Horizontal route for the desktop transcript: 4 stations; the segment after "here" is partly filled. */
export function RouteHorizontal({ stations, label, progress = 0.4 }: { stations: Station[]; label: string; progress?: number }) {
  const hereIndex = stations.findIndex((s) => s.state === "here");
  return (
    <ol aria-label={label} className="grid gap-4 sm:grid-cols-4 sm:gap-0">
      {stations.map((s, i) => {
        const last = i === stations.length - 1;
        let seg = "var(--tc-future)";
        if (s.state === "done") seg = "var(--tc-line)";
        if (i === hereIndex)
          seg = `linear-gradient(to right, var(--tc-line) ${progress * 100}%, var(--tc-future) ${progress * 100}%)`;
        return (
          <li key={s.title} className="relative flex gap-3 sm:block" aria-current={s.state === "here" ? "step" : undefined}>
            {!last ? (
              <div aria-hidden="true" className="anim-draw-x absolute top-[11px] left-3 hidden h-[6px] w-full sm:block" style={{ background: seg, ["--i" as string]: i }} />
            ) : null}
            <div aria-hidden="true" className="relative z-10 flex h-7 w-7 items-center justify-start">
              {s.state === "done" ? (
                <span className="rounded-full bg-surface">
                  <Icon icon={CheckCircleIcon} weight="fill" size={24} className="text-line" />
                </span>
              ) : s.state === "here" ? (
                <span className="block h-[26px] w-[26px] rounded-full bg-surface shadow-[inset_0_0_0_6px_var(--tc-line)]" />
              ) : (
                <span className="ml-[2px] block h-[22px] w-[22px] rounded-full bg-surface shadow-[inset_0_0_0_3px_var(--tc-future)]" />
              )}
            </div>
            <div className="sm:mt-3 sm:pr-6">
              <p className={cn("text-body font-extrabold", s.state === "next" ? "text-muted" : "text-ink")}>{s.title}</p>
              {s.sub ? <p className="mt-1 text-caption text-muted">{s.sub}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
