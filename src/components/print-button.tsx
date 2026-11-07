"use client";

import type { ReactNode } from "react";

/** `icon` is rendered on the server so it ships as HTML, not JavaScript. */
export function PrintButton({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex min-h-[44px] items-center gap-2 rounded-[8px] px-3 text-body-sm font-bold text-white hover:bg-white/10"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}
