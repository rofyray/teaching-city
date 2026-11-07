import { CheckCircleIcon, HourglassMediumIcon, TimerIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { formatHours, formatMoney } from "@/domain/rules";
import { getStudentArea } from "@/server/queries/student";
import { HoursForm } from "./hours-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hours");
  return { title: t("title") };
}

export default async function HoursPage() {
  const { current, view } = await getStudentArea();
  const t = await getTranslations();
  if (!view || view.enrollment.status === "proposed") {
    return (
      <>
        <PageHeader title={t("hours.title")} current={current} settingsHref="/s/settings" />
        <div className="mx-auto w-full max-w-[1280px] p-5 lg:px-10">
          <EmptyState icon={TimerIcon} title={t("home.notMatchedTitle")} body={t("home.notMatchedBody")} />
        </div>
      </>
    );
  }
  const { program, derived } = view;
  const lastWeek = Math.min(derived.rawWeek, program.weeks);
  const weeks = Array.from({ length: Math.max(lastWeek, 0) }, (_, i) => lastWeek - i);
  const approverName = view.preceptor?.name ?? "";

  return (
    <>
      <PageHeader
        title={t("hours.title")}
        subtitle={`${t("home.earned")}: ${formatMoney(derived.earnedCents)}`}
        current={current}
        settingsHref="/s/settings"
      />
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-3 px-5 py-4 md:grid-cols-2 lg:gap-6 lg:px-10 lg:py-8 xl:grid-cols-3">
        {weeks.map((week, i) => {
          const entry = view.hours.find((h) => h.week === week);
          const editable = view.enrollment.status === "active" && !entry?.approvedAt;
          return (
            <section key={week} aria-labelledby={`w-${week}`} className={i === 0 ? "card p-4 outline-ink" : "card p-4"}>
              <div className="flex items-center justify-between gap-3">
                <h2 id={`w-${week}`} className="text-subheading font-extrabold">
                  {t("hours.weekLabel", { week })}
                </h2>
                <span className="tabular text-body font-extrabold">
                  {entry ? t("common.hoursOf", { hours: formatHours(Number(entry.hours)), max: program.maxHours }) : null}
                </span>
              </div>
              {entry ? (
                <p className="mt-1 flex items-center gap-2 text-caption font-bold text-muted">
                  <Icon icon={entry.approvedAt ? CheckCircleIcon : HourglassMediumIcon} weight={entry.approvedAt ? "fill" : "regular"} size={16} className={entry.approvedAt ? "text-line" : undefined} />
                  {entry.approvedAt ? t("hours.approved", { name: approverName }) : t("hours.pending")}
                </p>
              ) : null}
              {editable ? (
                <div className="mt-3">
                  <HoursForm
                    week={week}
                    initialHours={entry ? Number(entry.hours) : null}
                    initialNote={entry?.note ?? ""}
                    payRateCents={program.payRateCents}
                    maxHours={program.maxHours}
                  />
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}
