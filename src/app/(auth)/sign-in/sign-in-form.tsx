"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition } from "react";
import * as z from "zod";
import { Icon } from "@/components/icon";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/toast";

export function SignInForm() {
  const t = useTranslations();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    if (!z.email().safeParse(email).success) {
      setError(t("auth.invalidEmail"));
      input.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await authClient.signIn.magicLink({ email, callbackURL: "/" });
      if (result.error) {
        setError(t("errors.generic"));
        toast.error(t("errors.generic"));
      } else {
        setSent(true);
        toast.success(t("auth.linkSent"));
      }
    });
  }

  if (sent) {
    return (
      <p role="status" className="text-body">
        {t("auth.linkSent")}
      </p>
    );
  }

  return (
    <form action={submit} noValidate className="flex flex-col gap-3">
      <label htmlFor={`${id}-email`} className="text-body font-bold">
        {t("auth.emailLabel")}
      </label>
      <input
        ref={input}
        id={`${id}-email`}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-[48px] rounded-[8px] border-2 border-rule bg-surface px-3 text-body"
      />
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-2 text-body-sm font-semibold text-due">
          <Icon icon={WarningCircleIcon} weight="bold" size={18} />
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-[8px] bg-ink px-4 text-body font-extrabold text-white disabled:opacity-70"
      >
        {t("auth.sendLink")}
      </button>
    </form>
  );
}
