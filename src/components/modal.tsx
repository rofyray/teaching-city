"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * A modal built on the native <dialog> element: showModal() gives the focus trap, Escape to close
 * and an inert page behind it without a dialog library.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,440px)] rounded-[8px] bg-surface p-6 text-ink backdrop:bg-ink/60"
    >
      <h2 id={`${id}-title`} className="text-heading font-extrabold">
        {title}
      </h2>
      {description ? (
        <p id={`${id}-desc`} className="mt-3 text-body text-muted">
          {description}
        </p>
      ) : null}
      {children}
    </dialog>
  );
}
