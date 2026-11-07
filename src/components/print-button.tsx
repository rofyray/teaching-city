"use client";

import { PrinterIcon } from "@phosphor-icons/react";
import { Icon } from "./icon";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex min-h-[44px] items-center gap-2 rounded-[8px] px-3 text-body-sm font-bold text-white hover:bg-white/10"
    >
      <Icon icon={PrinterIcon} weight="bold" size={22} />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}
