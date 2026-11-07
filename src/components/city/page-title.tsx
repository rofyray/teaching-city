import type { ReactNode } from "react";

export function PageTitle({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-title font-extrabold">{title}</h1>
        {lead ? <p className="mt-1 text-body-sm text-muted">{lead}</p> : null}
      </div>
      {children}
    </div>
  );
}

export const pageWrap = "mx-auto w-full max-w-[1280px] px-4 py-6 lg:px-10";
