"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { respondVendorRequest } from "@/server/actions/vendor";
import { toast } from "@/components/toast";

export function VendorResponse({ interestId }: { interestId: string }) {
  const t = useTranslations();
  const [state, setState] = useState<"accepted" | "declined" | "error" | null>(null);
  const [pending, startTransition] = useTransition();
  if (state === "accepted" || state === "declined") {
    return (
      <p role="status" className="text-body-sm font-bold">
        {state === "accepted" ? t("openings.accept") : t("openings.decline")}
      </p>
    );
  }
  const respond = (accept: boolean) =>
    startTransition(async () => {
      const r = await respondVendorRequest(interestId, accept);
      setState(r.ok ? (accept ? "accepted" : "declined") : "error");
      toast[r.ok ? "success" : "error"](r.ok ? t("common.saved") : t("errors.generic"));
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={() => respond(true)} className="min-h-[44px] rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white disabled:opacity-70">
        {t("openings.accept")}
      </button>
      <button type="button" disabled={pending} onClick={() => respond(false)} className="min-h-[44px] rounded-[8px] bg-surface px-4 text-body-sm font-bold outline-rule disabled:opacity-70">
        {t("openings.decline")}
      </button>
      {state === "error" ? (
        <span role="alert" className="text-caption font-bold text-due">
          {t("errors.generic")}
        </span>
      ) : null}
    </div>
  );
}
