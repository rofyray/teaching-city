const LINES = [
  { color: "var(--tc-line-finance)", top: 16, stops: [8, 34, 61] },
  { color: "var(--tc-line-works)", top: 40, stops: [20, 52, 83] },
  { color: "var(--tc-line-tech)", top: 64, stops: [14, 46, 72] },
  { color: "var(--tc-line-community)", top: 88, stops: [27, 58, 92] },
];

// Trains leave once the lines have drawn and park at the last stop well inside 5 seconds.
const TRAIN_START_MS = 1200;
const TRAIN_STAGGER_MS = 250;
const TRAIN_RIDE_MS = 2400;

/**
 * Four transit lines that draw across the hero; a train then rides each line once, each station
 * pulses as its train passes, and the train parks at the last stop. Decorative only; with reduced
 * motion the lines and stations show at once and no trains appear.
 */
export function HeroLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-28 w-full sm:h-36">
      {LINES.map((line, i) => {
        const last = line.stops[line.stops.length - 1];
        const start = TRAIN_START_MS + i * TRAIN_STAGGER_MS;
        return (
          <div key={line.color} className="absolute inset-x-0" style={{ top: `${line.top}%`, ["--c" as string]: line.color }}>
            <div className="anim-draw-x h-[5px] w-full" style={{ background: line.color, ["--i" as string]: i + 2 }} />
            {line.stops.map((x, j) => (
              <span
                key={x}
                className="anim-fade anim-pass absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
                style={{
                  left: `${x}%`,
                  boxShadow: `inset 0 0 0 4px ${line.color}`,
                  ["--i" as string]: 8 + i * 3 + j,
                  ["--at" as string]: `${Math.round(start + (TRAIN_RIDE_MS * x) / last)}ms`,
                }}
              />
            ))}
            <div className="hero-train absolute inset-0" style={{ ["--to" as string]: `${last}%`, ["--at" as string]: `${start}ms`, ["--ride" as string]: `${TRAIN_RIDE_MS}ms` }}>
              <span
                className="absolute top-1/2 left-0 h-[11px] w-10 -translate-x-full -translate-y-1/2 rounded-full bg-white"
                style={{ boxShadow: `0 0 0 3px ${line.color}, 0 0 14px 2px ${line.color}` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
