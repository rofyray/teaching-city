import { CaretLeftIcon, CheckIcon, InfoIcon, SignatureIcon, SparkleIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { canEditRating } from "@/domain/rules";
import { can } from "@/server/authz";
import { getEnrollmentView } from "@/server/queries/enrollment";
import { requireRole } from "@/server/session";
import { CheckIn } from "./check-in";

type Params = { enrollmentId: string; week: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { week } = await params;
  const t = await getTranslations("mentor");
  return { title: t("rateNow", { week }) };
}

export default async function RatePage({ params }: { params: Promise<Params> }) {
  const { enrollmentId, week: weekParam } = await params;
  const current = await requireRole("preceptor");
  const week = Number(weekParam);
  const view = await getEnrollmentView(enrollmentId);
  if (!view || !Number.isInteger(week) || week < 1 || week > view.program.weeks) notFound();
  if (view.enrollment.preceptorId !== current.id || !(await can(current, "ratings", "write", view.profile.id))) notFound();
  if (week > Math.max(view.derived.rawWeek, 1)) notFound();

  const existing = view.ratings.find((r) => r.week === week && r.submittedAt);
  const submittedWeeks = view.ratings.filter((r) => r.submittedAt).map((r) => r.week);
  if (existing && !canEditRating(week, submittedWeeks)) notFound();
  const previous = view.ratings.find((r) => r.week === week - 1 && r.submittedAt);

  return (
    <main id="main" data-line={view.unit?.lineColor} className="flex w-full flex-1 flex-col">
      <CheckIn
        enrollmentId={enrollmentId}
        week={week}
        firstName={view.student.firstName}
        signer={current.name}
        line={view.unit?.lineColor}
        icons={{
          back: <Icon icon={CaretLeftIcon} weight="bold" size={24} />,
          warning: <Icon icon={WarningCircleIcon} weight="bold" size={20} />,
          sparkle: <Icon icon={SparkleIcon} weight="duotone" size={20} />,
          info: <Icon icon={InfoIcon} weight="regular" size={20} />,
          signature: <Icon icon={SignatureIcon} weight="light" size={20} />,
          check: <Icon icon={CheckIcon} weight="bold" size={16} />,
        }}
        competencies={view.competencies.map((c) => ({
          id: c.id,
          position: c.position,
          label: c.label,
          lastWeek: previous?.scores.find((s) => s.competencyId === c.id)?.level,
        }))}
        initialLevels={Object.fromEntries(existing?.scores.map((s) => [s.competencyId, s.level]) ?? [])}
        initialNote={existing?.note ?? ""}
      />
    </main>
  );
}
