"use client";

import { useState } from "react";

/** Opens or closes every section of the submission at once. */
export function ExpandAll({ expand, collapse }: { expand: string; collapse: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !open;
        document.querySelectorAll<HTMLDetailsElement>("details[data-section]").forEach((d) => (d.open = next));
        setOpen(next);
      }}
      className="inline-flex min-h-[44px] items-center rounded-[8px] px-4 text-body-sm font-bold text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.5)] hover:shadow-[inset_0_0_0_2px_#fff]"
    >
      {open ? collapse : expand}
    </button>
  );
}
