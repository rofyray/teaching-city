"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { completeMeeting, scheduleMeeting } from "@/server/actions/mentor";
import { toast } from "@/components/toast";

const field = "min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-3 text-body";

export function ScheduleForm({ students }: { students: { enrollmentId: string; name: string }[] }) {
  const t = useTranslations();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      action={(fd) =>
        startTransition(async () => {
          const r = await scheduleMeeting(String(fd.get("enrollmentId")), String(fd.get("date")), String(fd.get("time")));
          setMessage(r.ok ? t("common.saved") : t("errors.generic"));
          toast[r.ok ? "success" : "error"](r.ok ? t("common.saved") : t("errors.generic"));
        })
      }
    >
      <label className="flex flex-col gap-1 text-body-sm font-bold" htmlFor={`${id}-s`}>
        {t("meetings.studentLabel")}
        <select id={`${id}-s`} name="enrollmentId" className={field} required>
          {students.map((s) => (
            <option key={s.enrollmentId} value={s.enrollmentId}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-body-sm font-bold" htmlFor={`${id}-d`}>
        {t("meetings.dateLabel")}
        <input id={`${id}-d`} type="date" name="date" required className={field} />
      </label>
      <label className="flex flex-col gap-1 text-body-sm font-bold" htmlFor={`${id}-t`}>
        {t("meetings.timeLabel")}
        <input id={`${id}-t`} type="time" name="time" defaultValue="15:00" required className={field} />
      </label>
      <button type="submit" disabled={pending} className="min-h-[44px] rounded-[8px] bg-ink px-4 text-body font-extrabold text-white disabled:opacity-70">
        {t("meetings.schedule")}
      </button>
      <p role="status" className="text-body-sm text-muted">
        {message}
      </p>
    </form>
  );
}

export function CompleteMeetingForm({ meetingId }: { meetingId: string }) {
  const t = useTranslations();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  return (
    <form
      className="mt-2 flex flex-col gap-2"
      action={(fd) =>
        startTransition(async () => {
          const r = await completeMeeting(meetingId, String(fd.get("summary") ?? ""));
          setError(!r.ok);
          toast[r.ok ? "success" : "error"](r.ok ? t("common.saved") : t("errors.generic"));
        })
      }
    >
      <label htmlFor={`${id}-sum`} className="text-body-sm font-bold">
        {t("meetings.summaryLabel")}
      </label>
      <textarea id={`${id}-sum`} name="summary" rows={2} maxLength={600} className="rounded-[8px] border-2 border-rule bg-surface p-2 text-body-sm" />
      <button type="submit" disabled={pending} className="min-h-[44px] self-start rounded-[8px] bg-surface px-3 text-body-sm font-bold outline-rule disabled:opacity-70">
        {t("meetings.markDone")}
      </button>
      {error ? (
        <p role="alert" className="text-caption font-bold text-due">
          {t("errors.generic")}
        </p>
      ) : null}
    </form>
  );
}
