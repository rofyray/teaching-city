import { LineBadge } from "@/components/line-badge";

type Branch = { edge: string; label: string; next: string | null };

const LINES = ["finance", "works", "tech", "community", "info"];
const PER_ROW = 5;
// Second row runs right to left so station 6 sits under station 5 and the line snakes on.
const ROW_2_COLS = ["lg:col-start-5", "lg:col-start-4", "lg:col-start-3", "lg:col-start-2", "lg:col-start-1"];

/**
 * The semester journey as one continuous line that draws itself as it scrolls into view:
 * vertical on phones; from 1024px it snakes through two rows (left to right, a turn, right to
 * left, a turn) into the last station, where the line forks into the two outcomes.
 * Badges are 36px, so lines are 6px tall at top 15px to run through their centers; turns
 * reach 40px (row gap) + 21px past the row to meet the next badge's center.
 */
export function JourneyRoute({ label, stations, branches }: { label: string; stations: readonly string[]; branches: readonly Branch[] }) {
  const lineOf = (i: number) => LINES[Math.floor(i / 2) % LINES.length];
  return (
    <div className="card mt-6 p-5 sm:p-8">
      <ol aria-label={label} className="grid lg:grid-cols-5 lg:gap-x-6 lg:gap-y-10">
        {stations.map((station, i) => {
          const row = Math.floor(i / PER_ROW);
          const pos = i % PER_ROW;
          const line = lineOf(i);
          const reversed = row === 1;
          return (
            <li
              key={station}
              data-line={line}
              className={`relative flex gap-4 pb-7 lg:flex-col lg:gap-3 lg:pb-0 ${reversed ? `lg:row-start-2 ${ROW_2_COLS[pos]}` : "lg:row-start-1"}`}
            >
              {/* Phones: straight down to the next station, including the fork. */}
              <span
                aria-hidden="true"
                data-reveal="draw-y"
                style={{ ["--i" as string]: i + 1 }}
                className="absolute top-9 bottom-0 left-[15px] w-[6px] bg-line lg:hidden"
              />
              {/* Row 1: right to the next station. Row 2: right to the previous one, drawn right to left. */}
              {!reversed && pos < PER_ROW - 1 ? (
                <span
                  aria-hidden="true"
                  data-reveal="draw-x"
                  style={{ ["--i" as string]: i + 1 }}
                  className="absolute top-[15px] right-[-24px] left-9 hidden h-[6px] bg-line lg:block"
                />
              ) : null}
              {reversed && pos > 0 ? (
                <span
                  aria-hidden="true"
                  data-line={lineOf(i - 1)}
                  data-reveal="draw-x-rev"
                  style={{ ["--i" as string]: i }}
                  className="absolute top-[15px] right-[-24px] left-9 hidden h-[6px] bg-line lg:block"
                />
              ) : null}
              {/* End of row 1: turn down the right edge into station 6. */}
              {!reversed && pos === PER_ROW - 1 ? (
                <span
                  aria-hidden="true"
                  data-reveal="fade"
                  style={{ ["--i" as string]: i + 1 }}
                  className="absolute top-[15px] right-[-20px] bottom-[-61px] left-9 hidden rounded-r-[28px] border-[6px] border-l-0 border-line lg:block"
                />
              ) : null}
              {/* End of row 2: turn down the left edge into the fork. */}
              {reversed && pos === PER_ROW - 1 ? (
                <span
                  aria-hidden="true"
                  data-reveal="fade"
                  style={{ ["--i" as string]: i + 1 }}
                  className="absolute top-[15px] right-full bottom-[-61px] hidden w-6 rounded-l-[24px] border-[6px] border-r-0 border-line lg:block"
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
        <li data-line="safety" className="relative flex lg:col-span-5 lg:row-start-3">
          <span data-reveal="pop" style={{ ["--i" as string]: stations.length }} className="relative">
            <LineBadge letter={String(stations.length + 1)} line="safety" size={36} />
          </span>
          {/* The line leaves the last station and forks: straight on to the first outcome, curving down to the second. */}
          <ul className="flex flex-1 flex-col gap-5">
            {branches.map((branch, j) => (
              <li key={branch.label} className="relative flex items-start gap-3 pl-10 sm:pl-16 lg:pl-40">
                {j === 0 ? (
                  <span
                    aria-hidden="true"
                    data-reveal="draw-x"
                    style={{ ["--i" as string]: stations.length + 1 }}
                    className="absolute top-[15px] left-0 h-[6px] w-10 bg-line sm:w-16 lg:w-40"
                  />
                ) : null}
                {j < branches.length - 1 ? (
                  <span
                    aria-hidden="true"
                    data-reveal="fade"
                    style={{ ["--i" as string]: stations.length + 2 }}
                    className="absolute top-[15px] bottom-[-41px] left-2 w-8 rounded-bl-[20px] border-b-[6px] border-l-[6px] border-line sm:left-4 sm:w-12 lg:w-36"
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  data-reveal="pop"
                  style={{ ["--i" as string]: stations.length + 2 + j }}
                  className="mt-[8px] h-5 w-5 shrink-0 rounded-full border-[5px] border-line bg-surface"
                />
                <div data-reveal="rise" style={{ ["--i" as string]: stations.length + 2 + j }} className="flex flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
                    <span className="rounded-full bg-line-tint px-2 py-0.5 text-caption font-extrabold text-line-ink">{branch.edge}</span>
                    <span className="text-body font-bold">{branch.label}</span>
                  </p>
                  {branch.next ? <p className="text-body-sm text-muted">{branch.next}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </li>
      </ol>
    </div>
  );
}
