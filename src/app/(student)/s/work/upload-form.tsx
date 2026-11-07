"use client";

import { UploadSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { upload } from "@vercel/blob/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { recordBlobSample, uploadSampleDirect } from "@/server/actions/student";
import { toast } from "@/components/toast";

const TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function UploadForm({
  enrollmentId,
  weeks,
  defaultWeek,
  maxMb,
  useBlob,
}: {
  enrollmentId: string;
  weeks: number[];
  defaultWeek: number;
  maxMb: number;
  useBlob: boolean;
}) {
  const t = useTranslations();
  const id = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<{ title?: string; file?: string; form?: string }>({});
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const next: typeof errors = {};
    if (!title) next.title = t("work.titleRequired");
    if (!(file instanceof File) || file.size === 0) next.file = t("work.wrongType");
    else if (!TYPES.includes(file.type)) next.file = t("work.wrongType");
    else if (file.size > maxMb * 1024 * 1024) next.file = t("work.tooBig", { size: maxMb });
    setErrors(next);
    setDone(false);
    if (Object.keys(next).length > 0) return;
    const f = file as File;
    startTransition(async () => {
      try {
        const week = Number(formData.get("week"));
        const description = String(formData.get("description") ?? "");
        let result;
        if (useBlob) {
          const blob = await upload(`samples/${enrollmentId}/${f.name}`, f, {
            access: "private",
            handleUploadUrl: "/api/blob/upload",
            contentType: f.type,
          });
          result = await recordBlobSample({ week, title, description, pathname: blob.pathname, url: blob.url, contentType: f.type, size: f.size });
        } else {
          result = await uploadSampleDirect(formData);
        }
        if (!result.ok) {
          const message =
            result.error === "wrongType" ? t("work.wrongType") : result.error === "tooBig" ? t("work.tooBig", { size: maxMb }) : t("work.uploadFailed");
          setErrors({ form: message });
          toast.error(message);
          return;
        }
        formRef.current?.reset();
        setDone(true);
        toast.success(t("work.added"));
        router.refresh();
      } catch {
        setErrors({ form: t("work.uploadFailed") });
        toast.error(t("work.uploadFailed"));
      }
    });
  }

  return (
    <form ref={formRef} action={submit} noValidate className="flex flex-col gap-3">
      <label htmlFor={`${id}-title`} className="text-body-sm font-bold">
        {t("work.titleLabel")}
      </label>
      <input
        id={`${id}-title`}
        name="title"
        maxLength={120}
        aria-invalid={errors.title ? true : undefined}
        aria-describedby={errors.title ? `${id}-title-err` : undefined}
        className="min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-3 text-body"
      />
      {errors.title ? (
        <p id={`${id}-title-err`} className="text-caption font-bold text-due">
          {errors.title}
        </p>
      ) : null}
      <label htmlFor={`${id}-desc`} className="text-body-sm font-bold">
        {t("work.descriptionLabel")}
      </label>
      <input id={`${id}-desc`} name="description" maxLength={160} className="min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-3 text-body" />
      <label htmlFor={`${id}-week`} className="text-body-sm font-bold">
        {t("work.weekLabel")}
      </label>
      <select id={`${id}-week`} name="week" defaultValue={defaultWeek} className="min-h-[44px] rounded-[8px] border-2 border-rule bg-surface px-3 text-body">
        {weeks.map((w) => (
          <option key={w} value={w}>
            {t("hours.weekLabel", { week: w })}
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-file`} className="text-body-sm font-bold">
        {t("work.fileLabel")}
      </label>
      <input
        id={`${id}-file`}
        name="file"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
        aria-invalid={errors.file ? true : undefined}
        aria-describedby={`${id}-help${errors.file ? ` ${id}-file-err` : ""}`}
        className="min-h-[44px] text-body-sm"
      />
      <p id={`${id}-help`} className="text-caption text-muted">
        {t("work.fileHelp", { size: maxMb })}
      </p>
      {errors.file ? (
        <p id={`${id}-file-err`} className="flex items-center gap-2 text-caption font-bold text-due">
          <Icon icon={WarningCircleIcon} weight="bold" size={16} />
          {errors.file}
        </p>
      ) : null}
      {errors.form ? (
        <p role="alert" className="text-body-sm font-bold text-due">
          {errors.form}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex min-h-[48px] items-center gap-2 rounded-[8px] bg-ink px-5 text-body font-extrabold text-white disabled:opacity-70">
          <Icon icon={UploadSimpleIcon} weight="bold" size={20} />
          {t("work.add")}
        </button>
        <span role="status" className="text-body-sm font-bold text-muted">
          {done ? t("common.saved") : pending ? t("common.loading") : null}
        </span>
      </div>
    </form>
  );
}
