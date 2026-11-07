"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { addPledge, endPledge } from "@/server/actions/city";
import { toast } from "@/components/toast";

const field = "min-h-[44px] w-full rounded-[8px] border-2 border-rule bg-surface px-2 text-body-sm";

export function AddPledgeForm({ vendorLabel, today }: { vendorLabel: string; today: string }) {
  const t = useTranslations();
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ vendorName: "", contactName: "", rolesOffered: "", pledgedAt: today });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white">
        {t("vendors.add")}
      </button>
    );
  }
  const inputs = [
    { key: "vendorName", label: vendorLabel, type: "text" },
    { key: "contactName", label: t("vendors.contact"), type: "text" },
    { key: "rolesOffered", label: t("vendors.roles"), type: "text" },
    { key: "pledgedAt", label: t("vendors.pledged"), type: "date" },
  ] as const;
  return (
    <form
      className="card grid w-full gap-3 p-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!values.vendorName.trim() || !values.contactName.trim() || !values.rolesOffered.trim() || !values.pledgedAt) {
          setError(t("errors.generic"));
          return;
        }
        start(async () => {
          const result = await addPledge(values);
          if (!result.ok) {
            setError(t("errors.generic"));
            toast.error(t("errors.generic"));
          } else {
            toast.success(t("common.saved"));
            setOpen(false);
            setValues({ vendorName: "", contactName: "", rolesOffered: "", pledgedAt: today });
            router.refresh();
          }
        });
      }}
    >
      {inputs.map((input) => (
        <div key={input.key} className="flex flex-col gap-1">
          <label htmlFor={`${id}-${input.key}`} className="text-caption font-bold">
            {input.label}
          </label>
          <input
            id={`${id}-${input.key}`}
            type={input.type}
            value={values[input.key]}
            onChange={(e) => setValues((v) => ({ ...v, [input.key]: e.target.value }))}
            className={field}
          />
        </div>
      ))}
      {error ? (
        <p role="alert" className="text-body-sm font-bold text-due sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2 sm:col-span-2">
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

export function EndPledgeButton({ pledgeId, vendorName }: { pledgeId: string; vendorName: string }) {
  const t = useTranslations("vendors");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await endPledge(pledgeId);
          router.refresh();
        })
      }
      className="inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-body-sm font-bold text-due outline-rule disabled:opacity-60"
    >
      {t("end")}
      <span className="sr-only">: {vendorName}</span>
    </button>
  );
}
