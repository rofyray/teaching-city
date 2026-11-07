import type { ReactNode } from "react";

/** Ink sign band with the page title, then the page body on the ground color. */
export function PageShell({ title, lead, children }: { title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="sign print-sign bg-ink text-white">
        <div className="mx-auto max-w-[1120px] px-4 pt-8 pb-10 sm:px-6 sm:pt-12">
          <h1 className="text-[32px] leading-[36px] font-extrabold sm:text-display">{title}</h1>
          {lead ? <div className="mt-4 max-w-[72ch] text-body text-sign-muted">{lead}</div> : null}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-6">{children}</div>
    </>
  );
}
