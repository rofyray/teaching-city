import { LineBadge } from "@/components/line-badge";

type Branch = { edge: string; label: string; next: string | null };

const LINES = ["finance", "works", "tech", "community", "info"];

/**
 * The semester journey as a route that draws itself station by station as it scrolls into view:
 * vertical on phones, rows of five from 1024px. The last station branches into two outcomes.
 */
export function JourneyRoute({ label, stations, branches }: { label: string; stations: readonly string[]; branches: readonly Branch[] }) {
  return (
    <div className="card mt-6 p-5 sm:p-8">
      <ol aria-label={label} className="grid lg:grid-cols-5 lg:gap-x-6 lg:gap-y-10">
        {stations.map((station, i) => {
          const endOfRow = (i + 1) % 5 === 0;
          const line = LINES[Math.floor(i / 2) % LINES.length];
          return (
            <li key={station} data-line={line} className="relative flex gap-4 pb-7 lg:flex-col lg:gap-3 lg:pb-0">
              {i < stations.length - 1 ? (
                <span
                  aria-hidden="true"
                  data-reveal="draw-route-lg"
                  style={{ ["--i" as string]: i + 1 }}
                  className={`absolute top-9 bottom-0 left-[15px] w-[6px] bg-line lg:top-[15px] lg:right-[-24px] lg:bottom-auto lg:left-9 lg:h-[6px] lg:w-auto ${endOfRow ? "lg:hidden" : ""}`}
                />
              ) : null}
              <span data-reveal="pop" style={{ ["--i" as string]: i }} className="relative">
                <LineBadge letter={String(i + 1)} line={line} size={36} />
              </span>
              <p data-reveal="rise" style={{ ["--i" as string]: i }} className="pt-1.5 text-body font-bold lg:pt-0">
                {station}
              </p>
            </li>
          );
        })}
        <li className="relative flex gap-4 lg:col-span-5">
          <span data-reveal="pop" style={{ ["--i" as string]: stations.length }} className="relative" data-line="safety">
            <LineBadge letter={String(stations.length + 1)} line="safety" size={36} />
          </span>
          <ul className="grid flex-1 gap-3 sm:grid-cols-2">
            {branches.map((branch, j) => (
              <li
                key={branch.label}
                data-reveal="rise"
                style={{ ["--i" as string]: stations.length + 1 + j }}
                className="rounded-[8px] p-4 outline-rule"
              >
                <p className="text-caption font-extrabold text-muted">{branch.edge}</p>
                <p className="text-body font-bold">{branch.label}</p>
                {branch.next ? <p className="mt-2 border-t border-rule pt-2 text-body-sm">{branch.next}</p> : null}
              </li>
            ))}
          </ul>
        </li>
      </ol>
    </div>
  );
}
