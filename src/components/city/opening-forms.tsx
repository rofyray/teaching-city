"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { createOpening, inviteToOpening, updateInvite } from "@/server/actions/city";
import { toast } from "@/components/toast";

const field = "min-h-[44px] w-full rounded-[8px] border-2 border-rule bg-surface px-2 text-body-sm";

export function NewOpeningForm({
  classifications,
  labels,
}: {
  classifications: { id: string; label: string; department: string }[];
  labels: { title: string; department: string };
}) {
  const t = useTranslations();
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [classificationId, setClassificationId] = useState(classifications[0]?.id ?? "");
  const [department, setDepartment] = useState(classifications[0]?.department ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white">
        {t("openingsAdmin.new")}
      </button>
    );
  }
  return (
    <form
      className="card grid w-full gap-3 p-4 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!title.trim()) {
          setError(t("errors.generic"));
          return;
        }
        start(async () => {
          const result = await createOpening({ title, classificationId, department });
          if (!result.ok) {
            setError(t("errors.generic"));
            toast.error(t("errors.generic"));
          } else {
            toast.success(t("common.saved"));
            setOpen(false);
            setTitle("");
            router.refresh();
          }
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-title`} className="text-caption font-bold">
          {labels.title}
        </label>
        <input id={`${id}-title`} value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-cls`} className="text-caption font-bold">
          {t("pool.classification")}
        </label>
        <select
          id={`${id}-cls`}
          value={classificationId}
          onChange={(e) => {
            setClassificationId(e.target.value);
            setDepartment(classifications.find((c) => c.id === e.target.value)?.department ?? "");
          }}
          className={field}
        >
          {classifications.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-dep`} className="text-caption font-bold">
          {labels.department}
        </label>
        <input id={`${id}-dep`} value={department} onChange={(e) => setDepartment(e.target.value)} className={field} />
      </div>
      {error ? (
        <p role="alert" className="text-body-sm font-bold text-due sm:col-span-3">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={pending} className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white disabled:opacity-70">
          {t("common.save")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body-sm font-bold outline-rule">
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}

export function InviteForm({ openingId, candidates, emptyLabel }: { openingId: string; candidates: { id: string; name: string }[]; emptyLabel: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (candidates.length === 0) return <p className="text-caption text-muted">{emptyLabel}</p>;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const result = await inviteToOpening(openingId, selected);
          toast[result.ok ? "success" : "error"](result.ok ? t("openingsAdmin.invited") : t("errors.generic"));
          if (!result.ok) setError(t("errors.generic"));
          else {
            setSelected([]);
            router.refresh();
          }
        });
      }}
    >
      <fieldset>
        <legend className="text-caption font-extrabold text-muted">{t("openingsAdmin.inviteLegend")}</legend>
        <ul className="mt-1 flex flex-wrap gap-2">
          {candidates.map((c) => (
            <li key={c.id}>
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[8px] px-3 text-body-sm font-bold outline-rule">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={selected.includes(c.id)}
                  onChange={(e) => setSelected((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))}
                />
                {c.name}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      {error ? <p className="mt-2 text-caption font-bold text-due">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || selected.length === 0}
        className="mt-2 inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white disabled:opacity-60"
      >
        {t("openingsAdmin.invite")}
      </button>
    </form>
  );
}

export function InviteDates({
  inviteId,
  name,
  interview,
  offer,
  canDecide,
}: {
  inviteId: string;
  name: string;
  interview: string;
  offer: string;
  canDecide: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const id = useId();
  const [interviewDate, setInterview] = useState(interview);
  const [offerDate, setOffer] = useState(offer);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(field: "interview" | "offer" | "accept" | "decline", date?: string) {
    setError(null);
    start(async () => {
      const result = await updateInvite({ inviteId, field, date: date || undefined });
      toast[result.ok ? "success" : "error"](result.ok ? t("common.saved") : t("errors.generic"));
      if (!result.ok) setError(t("errors.generic"));
      else router.refresh();
    });
  }

  return (
    <div className="relative flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-int`} className="text-caption font-bold">
          {t("openingsAdmin.interview")}
          <span className="sr-only">: {name}</span>
        </label>
        <span className="flex gap-1">
          <input id={`${id}-int`} type="date" value={interviewDate} onChange={(e) => setInterview(e.target.value)} className={`${field} w-auto`} />
          <button
            type="button"
            disabled={pending || !interviewDate || interviewDate === interview}
            onClick={() => run("interview", interviewDate)}
            className="inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-caption font-bold outline-rule disabled:opacity-50"
          >
            {t("common.save")}
            <span className="sr-only">
              : {t("openingsAdmin.interview")}, {name}
            </span>
          </button>
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-off`} className="text-caption font-bold">
          {t("openingsAdmin.offer")}
          <span className="sr-only">: {name}</span>
        </label>
        <span className="flex gap-1">
          <input id={`${id}-off`} type="date" value={offerDate} onChange={(e) => setOffer(e.target.value)} className={`${field} w-auto`} />
          <button
            type="button"
            disabled={pending || !offerDate || offerDate === offer}
            onClick={() => run("offer", offerDate)}
            className="inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-caption font-bold outline-rule disabled:opacity-50"
          >
            {t("common.save")}
            <span className="sr-only">
              : {t("openingsAdmin.offer")}, {name}
            </span>
          </button>
        </span>
      </div>
      {canDecide ? (
        <span className="flex gap-1">
          <button type="button" disabled={pending} onClick={() => run("accept")} className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-3 text-caption font-extrabold text-white">
            {t("openingsAdmin.accepted")}
          </button>
          <button type="button" disabled={pending} onClick={() => run("decline")} className="inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-caption font-bold outline-rule">
            {t("openingsAdmin.declined")}
          </button>
        </span>
      ) : null}
      {error ? <p className="w-full text-caption font-bold text-due">{error}</p> : null}
    </div>
  );
}
