import { FileTextIcon, PlusCircleIcon } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { Icon } from "./icon";

export function WorkSampleCard({
  title,
  meta,
  href,
  linkLabel,
  status,
  children,
}: {
  title: string;
  meta: string;
  href: string;
  linkLabel: string;
  status?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="card print-avoid flex flex-col gap-2 p-4 outline-rule">
      <div className="flex items-start justify-between gap-2">
        <Icon icon={FileTextIcon} weight="light" size={32} className="text-line" />
        {status}
      </div>
      <h3 className="text-body font-extrabold">{title}</h3>
      <p className="text-caption text-muted">{meta}</p>
      <a href={href} className="mt-auto inline-flex min-h-[44px] items-center text-body-sm font-bold underline">
        {linkLabel}
        <span className="sr-only">: {title}</span>
      </a>
      {children}
    </article>
  );
}

export function EmptySampleSlot({ title, body, href }: { title: string; body: string; href?: string }) {
  const inner = (
    <>
      <Icon icon={PlusCircleIcon} weight="thin" size={40} className="text-muted" />
      <span className="text-body font-extrabold text-muted">{title}</span>
      <span className="text-caption text-muted">{body}</span>
    </>
  );
  const cls = "no-print flex min-h-[156px] flex-col gap-2 rounded-[8px] p-4 text-ink no-underline shadow-[inset_0_0_0_2px_var(--tc-future)]";
  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
