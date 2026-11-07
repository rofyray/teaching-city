import { LineBadge } from "@/components/line-badge";
import { cn } from "@/lib/cn";

const LINES = ["finance", "works", "tech", "community"];

/**
 * The four parts drawn as stations on a line. Phones: a vertical route. From 768px: stations
 * spread evenly across the section, each number centered over its text, with a pointer line down
 * to the text and alternating pointer lengths so neighboring labels stagger.
 */
export function FourPartRoute({ stations, label }: { stations: readonly { name: string; line: string }[]; label: string }) {
  return (
    <ol aria-label={label} className="grid md:grid-cols-4">
      {stations.map((station, i) => {
        const last = i === stations.length - 1;
        const line = LINES[i % LINES.length];
        return (
          <li key={station.name} data-line={line} className="relative flex gap-4 pb-8 md:flex-col md:items-center md:gap-0 md:px-3 md:pb-0 md:text-center">
            {!last ? (
              <span
                aria-hidden="true"
                data-reveal="draw-route"
                style={{ ["--i" as string]: i * 2 + 1 }}
                className="absolute top-10 bottom-0 left-[17px] w-[6px] bg-line md:top-[17px] md:right-[-50%] md:bottom-auto md:left-1/2 md:h-[6px] md:w-auto"
              />
            ) : null}
            <span data-reveal="pop" style={{ ["--i" as string]: i * 2 }} className="relative">
              <LineBadge letter={String(i + 1)} line={line} />
            </span>
            <span
              aria-hidden="true"
              data-reveal="draw-y"
              style={{ ["--i" as string]: i * 2 + 1 }}
              className={cn("hidden w-[3px] bg-line md:block", i % 2 === 0 ? "h-5" : "h-16")}
            />
            <div data-reveal="rise" style={{ ["--i" as string]: i * 2 + 1 }} className="flex flex-col gap-1 pt-2 md:max-w-[260px] md:pt-3">
              <h3 className="text-subheading font-extrabold">{station.name}</h3>
              <p className="text-body-sm text-muted">{station.line}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
