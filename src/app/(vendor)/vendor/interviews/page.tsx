import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { InterviewForm } from "@/components/vendor/interview-form";
import { vendorCopy } from "@/content/vendor-copy";
import { localDate } from "@/domain/time";
import { getProgram } from "@/server/queries/enrollment";
import { getFirm, listFirmInterviews } from "@/server/queries/vendor";
import { requireRole } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("vendorInterviews") };
}

function localDateTimeValue(at: Date | null, timeZone: string) {
  if (!at) return "";
  const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
  return `${localDate(at, timeZone)}T${time}`;
}

export default async function VendorInterviewsPage() {
  const current = await requireRole("vendor_recruiter");
  const t = await getTranslations();
  const locale = await getLocale();
  const firm = await getFirm(current);
  const program = await getProgram();
  const rows = firm ? await listFirmInterviews(firm) : [];
  const date = new Intl.DateTimeFormat(locale, { timeZone: program.timeZone, month: "short", day: "numeric", year: "numeric" });
  const dateTime = new Intl.DateTimeFormat(locale, {
    timeZone: program.timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 lg:px-10">
      <h1 className="text-title font-extrabold">{t("nav.vendorInterviews")}</h1>
      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarCheckIcon}
            title={vendorCopy(locale, "interviewsEmptyTitle")}
            body={vendorCopy(locale, "interviewsEmptyBody")}
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {rows.map((row) => (
            <li key={row.id} className="card flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-subheading font-extrabold">{row.name}</h2>
                {row.studentResponse === "accepted" ? (
                  <StatusPill variant="confirmed">{t("openingsAdmin.accepted")}</StatusPill>
                ) : row.studentResponse === "declined" ? (
                  <StatusPill variant="asked">{t("openingsAdmin.declined")}</StatusPill>
                ) : (
                  <StatusPill variant="due">{t("vendorPortal.requested")}</StatusPill>
                )}
              </div>
              <p className="text-body-sm text-muted">{vendorCopy(locale, "requestedOn", { date: date.format(row.requestedAt) })}</p>
              {row.studentResponse === "accepted" ? (
                <InterviewForm
                  interestId={row.id}
                  interviewAt={localDateTimeValue(row.interviewAt, program.timeZone)}
                  outcome={row.outcome}
                  outcomeNoneLabel={vendorCopy(locale, "outcomeNone")}
                />
              ) : row.interviewAt ? (
                <p className="text-body-sm">{t("openings.interviewOn", { date: dateTime.format(row.interviewAt) })}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
