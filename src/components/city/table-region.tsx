import type { ReactNode } from "react";

/** Tables scroll inside their own box so the page never scrolls sideways (Section 9.6). */
export function TableRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="card relative mt-3 overflow-x-auto">
      {children}
    </div>
  );
}

export const th = "px-4 py-3 text-left text-micro font-extrabold text-muted";
export const td = "border-t border-rule px-4 py-3 align-top text-body-sm";
