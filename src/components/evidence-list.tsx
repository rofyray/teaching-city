import { LevelPill } from "./level";

export type EvidenceRow = { competencyId: string; label: string; level?: number; levelLabel?: string; sentence?: string | null };

export function EvidenceList({ rows }: { rows: EvidenceRow[] }) {
  return (
    <ul className="mt-3">
      {rows.map((row) => (
        <li key={row.competencyId} className="border-t border-rule py-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] leading-5 font-extrabold">{row.label}</h3>
            {row.level && row.levelLabel ? <LevelPill level={row.level} label={row.levelLabel} /> : null}
          </div>
          {row.sentence ? <p className="mt-2 text-body text-muted">{row.sentence}</p> : null}
        </li>
      ))}
    </ul>
  );
}
