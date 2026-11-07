import { SignpostIcon, SparkleIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { MatchForm } from "@/components/city/match-form";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { CITY_COPY, matchReason, pick } from "@/content/city-copy";
import { formatHours } from "@/domain/rules";
import { cityStaff, listClassifications, listUnits, unmatchedStudents } from "@/server/queries/city";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("matching");
  return { title: t("title") };
}

export default async function MatchingPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const [students, units, classes, staff] = await Promise.all([unmatchedStudents(), listUnits(), listClassifications(), cityStaff()]);
  const codeTitle = Object.fromEntries(classes.map((c) => [c.cls.code, c.cls.title]));

  return (
    <div className={pageWrap}>
      <PageTitle title={t("matching.title")} lead={t("matching.manualNote")} />
      <h2 className="mt-6 text-heading font-extrabold">{t("matching.unmatched")}</h2>
      {students.length === 0 ? (
        <div className="mt-3">
          <EmptyState icon={SignpostIcon} title={pick(CITY_COPY.matchingEmptyTitle, locale)} body={pick(CITY_COPY.matchingEmptyBody, locale)} />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {students.map((s) => {
            const suggestedIds = s.suggestions.map((x) => x.unitId);
            const ordered = [
              ...s.suggestions.map((x) => units.find((u) => u.id === x.unitId)!),
              ...units.filter((u) => !suggestedIds.includes(u.id)),
            ];
            const reasons = Object.fromEntries(
              units.map((u) => {
                const overlap = s.suggestions.find((x) => x.unitId === u.id)?.overlap ?? 0;
                return [u.id, matchReason(s.major ?? "", u.name, Number(formatHours(overlap)), Number(formatHours(s.free)))];
              }),
            );
            return (
              <li key={s.profileId} className="card flex flex-col gap-4 p-5">
                <div>
                  <h3 className="text-subheading font-extrabold">{s.name}</h3>
                  <p className="text-body-sm text-muted">{[s.major, s.collegeName].filter(Boolean).join(", ")}</p>
                </div>
                <div>
                  <h4 className="text-caption font-extrabold text-muted">{t("matching.suggested")}</h4>
                  {s.suggestions.length === 0 ? (
                    <p className="mt-1 text-body-sm">{pick(CITY_COPY.noSuggestions, locale)}</p>
                  ) : (
                    <ol className="mt-1 flex flex-col gap-1">
                      {s.suggestions.map((x) => (
                        <li key={x.unitId} className="text-body-sm">
                          <span className="font-bold">{x.unitName}</span>
                          <span className="text-muted">
                            {", "}
                            {t("matching.overlap", { overlap: formatHours(x.overlap), free: formatHours(x.free) })}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                {s.courseMapping && s.courseMapping.length > 0 ? (
                  <div className="rounded-[8px] bg-ground p-3">
                    <h4 className="flex items-center gap-2 text-caption font-extrabold text-muted">
                      <Icon icon={SparkleIcon} weight="duotone" size={18} />
                      {t("onboarding.rolesYourCourses")}
                    </h4>
                    <ul className="mt-1 flex flex-col gap-1">
                      {s.courseMapping.map((m) => (
                        <li key={m.classificationCode} className="text-body-sm">
                          <span className="font-bold">{codeTitle[m.classificationCode] ?? m.classificationCode}</span>
                          <span className="text-muted">: {m.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <MatchForm
                  profileId={s.profileId}
                  defaultUnitId={ordered[0]?.id ?? ""}
                  units={ordered.map((u) => ({ id: u.id, label: u.name, classificationId: u.classification?.id ?? null }))}
                  classifications={classes.map((c) => ({ id: c.cls.id, label: c.cls.title }))}
                  preceptors={staff.preceptors.map((p) => ({ id: p.id, label: p.title ? `${p.name}, ${p.title}` : p.name }))}
                  sponsors={staff.sponsors.map((p) => ({ id: p.id, label: p.title ? `${p.name}, ${p.title}` : p.name }))}
                  reasons={reasons}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
