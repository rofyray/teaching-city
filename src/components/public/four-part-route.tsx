import { LineBadge } from "@/components/line-badge";

const LINES = ["finance", "works", "tech", "community"];

/** The four parts drawn as stations on a line: vertical on phones, horizontal from 640px. */
export function FourPartRoute({ stations, label }: { stations: readonly { name: string; line: string }[]; label: string }) {
  return (
    <ol aria-label={label} className="grid sm:grid-cols-4 sm:gap-6">
      {stations.map((station, i) => (
        <li key={station.name} data-line={LINES[i % LINES.length]} className="relative flex gap-4 pb-8 sm:flex-col sm:gap-3 sm:pb-0">
          {i < stations.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-10 bottom-0 left-[17px] w-[6px] bg-future sm:top-[17px] sm:right-[-24px] sm:bottom-auto sm:left-10 sm:h-[6px] sm:w-auto"
            />
          ) : null}
          <LineBadge letter={String(i + 1)} line={LINES[i % LINES.length]} className="relative" />
          <div className="flex flex-col gap-1 pt-2 sm:pt-0">
            <h3 className="text-subheading font-extrabold">{station.name}</h3>
            <p className="text-body-sm text-muted">{station.line}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
