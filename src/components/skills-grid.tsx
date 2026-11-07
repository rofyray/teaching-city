import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react/ssr";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { levelCell } from "./level";

export type GridRow = { competencyId: string; label: string; byWeek: Map<number, number>; latest?: number };

/** Week-by-week observed skills: a real table, rating text inside each colored cell (Section 9.5). */
export async function SkillsGrid({ rows, weeks, caption }: { rows: GridRow[]; weeks: number[]; caption: string }) {
  const t = await getTranslations();
  return (
    <div>
      <div className="mt-3 overflow-x-auto" role="region" aria-label={caption} tabIndex={0}>
        <table className="w-full border-collapse" style={{ minWidth: 220 + weeks.length * 84 + 120 }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="py-2 text-left text-micro font-extrabold text-muted">
                {t("transcript.skill")}
              </th>
              {weeks.map((w) => (
                <th key={w} scope="col" className="px-1 py-2 text-center text-micro font-extrabold text-muted">
                  {t("transcript.week", { week: w })}
                </th>
              ))}
              <th scope="col" className="py-2 pl-3 text-left text-micro font-extrabold text-muted">
                {t("transcript.latest")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const atBar = row.latest !== undefined && row.latest >= 3;
              return (
                <tr key={row.competencyId} className="border-t border-rule">
                  <th scope="row" className="py-[10px] pr-3 text-left text-[15px] leading-5 font-bold">
                    {row.label}
                  </th>
                  {weeks.map((w) => {
                    const level = row.byWeek.get(w);
                    return (
                      <td key={w} className="p-1">
                        {level ? (
                          <div
                            className={cn(
                              "flex min-h-8 items-center justify-center rounded-[6px] px-1 text-center text-micro font-extrabold",
                              levelCell[level],
                            )}
                          >
                            {t(`levels.short${level}` as "levels.short1")}
                          </div>
                        ) : (
                          <div className="min-h-8" />
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 pl-3 whitespace-nowrap">
                    {atBar ? (
                      <span className="flex items-center gap-[6px] text-caption font-extrabold text-line">
                        <Icon icon={CheckCircleIcon} weight="fill" size={18} />
                        {t("transcript.atTheBar")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-[6px] text-caption font-bold text-muted">
                        <Icon icon={CircleIcon} weight="bold" size={18} />
                        {t("transcript.notYet")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label={t("transcript.latest")}>
        {[1, 2, 3, 4].map((l) => (
          <li key={l} className="flex items-center gap-[6px] text-micro font-bold text-muted">
            <span aria-hidden="true" className={cn("inline-block h-3 w-3 rounded-[3px]", levelCell[l])} />
            {t(`levels.${l}` as "levels.1")}
          </li>
        ))}
      </ul>
    </div>
  );
}
