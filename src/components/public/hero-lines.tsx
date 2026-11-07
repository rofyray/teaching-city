const LINES = [
  { color: "var(--tc-line-finance)", top: 16, stops: [8, 34, 61] },
  { color: "var(--tc-line-works)", top: 40, stops: [20, 52, 83] },
  { color: "var(--tc-line-tech)", top: 64, stops: [14, 46, 72] },
  { color: "var(--tc-line-community)", top: 88, stops: [27, 58, 92] },
];

/** Four transit lines with stations that draw across the hero. Decorative only. */
export function HeroLines() {
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-28 w-full sm:h-36">
      {LINES.map((line, i) => (
        <div key={line.color} className="absolute inset-x-0" style={{ top: `${line.top}%` }}>
          <div className="anim-draw-x h-[5px] w-full" style={{ background: line.color, ["--i" as string]: i + 2 }} />
          {line.stops.map((x, j) => (
            <span
              key={x}
              className="anim-fade absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
              style={{ left: `${x}%`, boxShadow: `inset 0 0 0 4px ${line.color}`, ["--i" as string]: 8 + i * 3 + j }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
