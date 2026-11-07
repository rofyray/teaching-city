import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getProgram } from "@/server/queries/enrollment";
import { getMentorStudents, getSponsorMeetings } from "@/server/queries/mentor";
import { requireRole } from "@/server/session";
import { CompleteMeetingForm, ScheduleForm } from "./meeting-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meetings");
  return { title: t("title") };
}

export default async function MeetingsPage() {
  const current = await requireRole("preceptor", "sponsor");
  if (!current.roles.includes("sponsor")) redirect("/m");
  const t = await getTranslations();
  const locale = await getLocale();
  const program = await getProgram();
  const meetings = await getSponsorMeetings(current.id);
  const students = (await getMentorStudents(current.id)).filter((s) => s.isSponsor);
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: program.timeZone });

  return (
    <>
      <PageHeader title={t("meetings.title")} current={current} />
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-6 px-4 py-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:px-10 lg:py-8">
        {students.length > 0 ? (
          <section aria-labelledby="sched" className="card p-5">
            <h2 id="sched" className="mb-3 text-subheading font-extrabold">
              {t("meetings.schedule")}
            </h2>
            <ScheduleForm students={students.map((s) => ({ enrollmentId: s.enrollmentId, name: s.name }))} />
          </section>
        ) : null}
        {meetings.length === 0 ? (
          <EmptyState icon={CalendarCheckIcon} title={t("meetings.title")} body={t("mentor.emptyBody")} />
        ) : (
          <ul className="card overflow-hidden">
            {meetings.map(({ meeting, name }) => (
              <li key={meeting.id} className="border-t border-rule px-4 py-4 first:border-t-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-body font-extrabold">{name}</span>
                  <span className="tabular text-body-sm text-muted">{fmt.format(meeting.scheduledAt)}</span>
                </div>
                {meeting.completedAt ? (
                  <p className="mt-1 text-body-sm text-muted">{meeting.summary}</p>
                ) : (
                  <CompleteMeetingForm meetingId={meeting.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
