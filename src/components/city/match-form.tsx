"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { confirmMatch } from "@/server/actions/city";

type Option = { id: string; label: string };

export function MatchForm({
  profileId,
  units,
  classifications,
  preceptors,
  sponsors,
  reasons,
  defaultUnitId,
}: {
  profileId: string;
  /** Suggested units first, then the rest. Any unit can be chosen. */
  units: (Option & { classificationId: string | null })[];
  classifications: Option[];
  preceptors: Option[];
  sponsors: Option[];
  /** Prefilled reason per unit id, from the Content Pack 13.4 template. */
  reasons: Record<string, string>;
  defaultUnitId: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const id = useId();
  const firstUnit = units.find((u) => u.id === defaultUnitId) ?? units[0];
  const [unitId, setUnitId] = useState(firstUnit?.id ?? "");
  const [classificationId, setClassificationId] = useState(firstUnit?.classificationId ?? classifications[0]?.id ?? "");
  const [preceptorId, setPreceptorId] = useState(preceptors[0]?.id ?? "");
  const [sponsorId, setSponsorId] = useState(sponsors[0]?.id ?? "");
  const [reason, setReason] = useState(reasons[firstUnit?.id ?? ""] ?? "");
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const field = "min-h-[44px] w-full rounded-[8px] border-2 border-rule bg-surface px-2 text-body-sm";

  if (success) {
    return (
      <p role="status" className="text-body font-bold">
        {success}
      </p>
    );
  }

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const result = await confirmMatch({ profileId, unitId, classificationId, preceptorId, sponsorId, reason });
          if (!result.ok) {
            setError(result.error === "full" ? t("matching.full", { unit: result.data?.unit ?? "" }) : t("errors.generic"));
            return;
          }
          setSuccess(t("matching.confirmed", { firstName: result.data?.firstName ?? "", preceptor: result.data?.preceptor ?? "" }));
          router.refresh();
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-unit`} className="text-caption font-bold">
          {t("pool.unit")}
        </label>
        <select
          id={`${id}-unit`}
          value={unitId}
          onChange={(e) => {
            const next = units.find((u) => u.id === e.target.value);
            setUnitId(e.target.value);
            if (next?.classificationId) setClassificationId(next.classificationId);
            if (!edited) setReason(reasons[e.target.value] ?? "");
          }}
          className={field}
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-cls`} className="text-caption font-bold">
          {t("pool.classification")}
        </label>
        <select id={`${id}-cls`} value={classificationId} onChange={(e) => setClassificationId(e.target.value)} className={field}>
          {classifications.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-pre`} className="text-caption font-bold">
          {t("people.preceptor")}
        </label>
        <select id={`${id}-pre`} value={preceptorId} onChange={(e) => setPreceptorId(e.target.value)} className={field}>
          {preceptors.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-spo`} className="text-caption font-bold">
          {t("people.sponsor")}
        </label>
        <select id={`${id}-spo`} value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} className={field}>
          {sponsors.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`${id}-reason`} className="text-caption font-bold">
          {t("matching.reasonLabel")}
        </label>
        <textarea
          id={`${id}-reason`}
          rows={2}
          maxLength={400}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setEdited(true);
          }}
          className="rounded-[8px] border-2 border-rule bg-surface p-2 text-body-sm"
        />
      </div>
      {error ? (
        <p role="alert" className="text-body-sm font-bold text-due sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending || !reason.trim()}
          className="inline-flex min-h-[48px] items-center rounded-[8px] bg-ink px-5 text-body font-extrabold text-white disabled:opacity-70"
        >
          {t("matching.confirm")}
        </button>
      </div>
    </form>
  );
}
