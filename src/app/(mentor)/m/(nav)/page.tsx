import { CalendarCheckIcon, CaretRightIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { LineBadge } from "@/components/line-badge";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { getProgram } from "@/server/queries/enrollment";
import { getMentorStudents, getSponsorMeetings, meetingsHeldThisMonth, type MentorStudent } from "@/server/queries/mentor";
import { requireRole } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mentor");
  return { title: t("title") };
}

export default async function MentorHome() {
  const current = await requireRole("preceptor", "sponsor");
  const t = await getTranslations();
  const program = await getProgram();
  const students = await getMentorStudents(current.id);
  const precepting = students.filter((s) => s.isPreceptor);
  const due = precepting.filter((s) => s.dueWeek !== null).sort((a, b) => (a.dueState === "overdue" ? -1 : 0) - (b.dueState === "overdue" ? -1 : 0));
  const done = precepting.filter((s) => s.dueWeek === null);
  const sponsored = students.filter((s) => s.isSponsor);
  const isSponsor = current.roles.includes("sponsor");
  const meetings = isSponsor ? await getSponsorMeetings(current.id) : [];
  const heldThisMonth = meetingsHeldThisMonth(meetings.map((m) => m.meeting), new Date(), program.timeZone);

  const row = (s: MentorStudent, action: React.ReactNode) => (
    <li key={s.enrollmentId} data-line={s.lineColor} className="flex flex-wrap items-center gap-3 border-t border-rule px-4 py-3 first:border-t-0">
      <LineBadge letter={s.lineLetter} line={s.lineColor} size={36} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-extrabold">{s.name}</span>
        <span className="text-caption text-muted">
          {s.unitName}, {t("common.weekOf", { week: s.week, total: program.weeks })}
        </span>
      </div>
      {action}
    </li>
  );

  return (
    <>
      <PageHeader title={t("mentor.title")} current={current} />
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-4 py-5 lg:px-10">
        {students.length === 0 ? (
          <EmptyState icon={UsersThreeIcon} title={t("mentor.emptyTitle")} body={t("mentor.emptyBody")} />
        ) : null}

        {precepting.length > 0 ? (
          <section aria-labelledby="due" className="card overflow-hidden outline-ink">
            <h2 id="due" className="px-4 pt-3 pb-2 text-body-sm font-extrabold">
              {t("mentor.ratingsDue")}
            </h2>
            <ul>
              {due.map((s) =>
                row(
                  s,
                  <div className="flex items-center gap-2">
                    <StatusPill variant="due">{s.dueState === "overdue" ? t("home.overdue") : t("home.dueFriday")}</StatusPill>
                    <Link
                      href={`/m/rate/${s.enrollmentId}/${s.dueWeek}`}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-[8px] bg-ink px-3 text-body-sm font-extrabold text-white no-underline"
                    >
                      {t("mentor.rateNow", { week: s.dueWeek! })}
                    </Link>
                  </div>,
                ),
              )}
            </ul>
          </section>
        ) : null}

        {done.length > 0 ? (
          <section aria-labelledby="done" className="card overflow-hidden">
            <h2 id="done" className="px-4 pt-3 pb-2 text-body-sm font-extrabold">
              {t("mentor.doneThisWeek")}
            </h2>
            <ul>
              {done.map((s) =>
                row(
                  s,
                  <Link href={`/m/students/${s.enrollmentId}`} className="inline-flex min-h-[44px] items-center gap-1 text-body-sm font-bold">
                    {t("mentor.viewStudent", { firstName: s.firstName })}
                    <Icon icon={CaretRightIcon} weight="bold" size={16} />
                  </Link>,
                ),
              )}
            </ul>
          </section>
        ) : null}

        {precepting.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {precepting.map((s) => (
              <li key={s.enrollmentId}>
                <Link href={`/m/students/${s.enrollmentId}`} className="inline-flex min-h-[44px] items-center gap-1 rounded-[8px] bg-surface px-3 text-body-sm font-bold">
                  {t("mentor.viewStudent", { firstName: s.firstName })}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {isSponsor ? (
          <section aria-labelledby="meet" className="card overflow-hidden">
            <div className="flex items-center gap-3 px-4 pt-3 pb-2">
              <Icon icon={CalendarCheckIcon} weight="regular" size={22} className="text-muted" />
              <h2 id="meet" className="flex-1 text-body-sm font-extrabold">
                {t("mentor.meetingsThisMonth")}
              </h2>
              <span className="tabular text-body font-extrabold">{heldThisMonth}</span>
            </div>
            <ul>
              {sponsored.map((s) =>
                row(
                  s,
                  <Link href={`/m/students/${s.enrollmentId}`} className="inline-flex min-h-[44px] items-center gap-1 text-body-sm font-bold">
                    {t("mentor.viewStudent", { firstName: s.firstName })}
                    <Icon icon={CaretRightIcon} weight="bold" size={16} />
                  </Link>,
                ),
              )}
            </ul>
            <div className="border-t border-rule px-4 py-3">
              <Link href="/m/meetings" className="inline-flex min-h-[44px] items-center text-body-sm font-bold">
                {t("nav.meetings")}
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
