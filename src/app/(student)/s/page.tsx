import {
  CalendarCheckIcon,
  CaretRightIcon,
  ClipboardTextIcon,
  CurrencyDollarIcon,
  MapTrifoldIcon,
  TimerIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { HeaderActions } from "@/components/header-actions";
import { Icon } from "@/components/icon";
import { RouteVertical, type Station } from "@/components/route";
import { SignBand } from "@/components/sign-band";
import { ThisWeekPanel, type ThisWeekRow } from "@/components/this-week-panel";
import { formatHours, formatMoney } from "@/domain/rules";
import { getStudentArea } from "@/server/queries/student";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("route") };
}

export default async function StudentHome() {
  const { current, profile, view } = await getStudentArea();
  if (!profile.onboardedAt) redirect("/s/onboarding");
  const t = await getTranslations();
  const actions = (
    <div className="flex lg:hidden">
      <HeaderActions current={current} settingsHref="/s/settings" />
    </div>
  );

  if (!view || view.enrollment.status === "proposed") {
    return (
      <>
        <SignBand title={t("common.appName")} action={actions} />
        <div className="mx-auto w-full max-w-[1280px] p-5 lg:px-10">
          <EmptyState icon={MapTrifoldIcon} title={t("home.notMatchedTitle")} body={t("home.notMatchedBody")} />
        </div>
      </>
    );
  }

  const { unit, program, derived, preceptor, sponsor } = view;
  const firstName = (name?: string | null) => name?.split(" ")[0] ?? "";
  const rows: ThisWeekRow[] = [];
  for (const item of derived.dueItems) {
    const due = item.state === "overdue" ? t("home.overdue") : t("home.dueFriday");
    if (item.kind === "rating") rows.push({ icon: ClipboardTextIcon, label: t("home.dueRating", { preceptor: firstName(preceptor?.name) }), due });
    if (item.kind === "hours") rows.push({ icon: TimerIcon, label: t("home.dueHours"), due, href: "/s/hours" });
    if (item.kind === "meeting")
      rows.push({ icon: CalendarCheckIcon, label: t("home.dueMeeting", { sponsor: firstName(sponsor?.name) }), due: t("home.dueToday") });
  }
  // Only the most urgent item is highlighted (one accent per screen).
  const [first, ...rest] = rows;
  const dueRows = first ? [first, ...rest.map((r) => ({ ...r, due: undefined, value: r.due }))] : [];
  dueRows.push(
    {
      icon: TimerIcon,
      label: t("home.hoursLogged"),
      value: t("common.hoursOf", { hours: formatHours(Number(derived.thisWeekHours?.hours ?? 0)), max: program.maxHours }),
      href: "/s/hours",
    },
    { icon: CurrencyDollarIcon, label: t("home.earned"), value: formatMoney(derived.earnedCents) },
  );

  const completed = view.enrollment.status === "completed";
  const stations: Station[] = [
    { title: t("home.stationMatched"), sub: t("home.stationMatchedSub", { unit: unit?.name ?? "" }), state: "done" },
    {
      title: t("common.weekOf", { week: derived.week, total: program.weeks }),
      sub: completed ? undefined : t("home.stationHereSub", { weeksLeft: `${t("common.weeksLeft", { count: derived.weeksLeft })}.` }),
      state: completed ? "done" : "here",
    },
    {
      title: t("home.stationTranscript"),
      sub: t("home.stationTranscriptSub", { count: derived.atBar }),
      state: completed ? "done" : "next",
    },
    { title: t("home.stationExit"), sub: t("home.stationExitSub"), state: completed ? "here" : "next" },
  ];

  return (
    <>
      <SignBand
        title={unit?.name ?? t("common.appName")}
        subtitle={unit ? t("home.lineSubtitle", { line: unit.lineName, city: view.cityName }) : undefined}
        letter={unit?.lineLetter}
        line={unit?.lineColor}
        action={actions}
      />
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-4 px-5 py-4 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6 lg:px-10 lg:py-8">
        <ThisWeekPanel title={t("home.thisWeek")} rows={dueRows} />
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <RouteVertical label={t("home.routeLabel")} stations={stations} />
        </div>
        <Link href="/s/people" className="card flex min-h-[48px] lg:col-start-1 items-center gap-3 px-4 py-3 text-ink no-underline">
          <Icon icon={UsersThreeIcon} weight="duotone" size={26} className="text-line" />
          <span className="flex-1 text-body font-bold">{t("home.references")}</span>
          <span className="tabular text-body font-extrabold">
            {t("common.of", { count: derived.confirmed, total: program.referencesRequired })}
          </span>
          <Icon icon={CaretRightIcon} weight="bold" size={16} className="text-muted" />
        </Link>
      </div>
    </>
  );
}
