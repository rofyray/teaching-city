"use client";

import { useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

export type ToastVariant = "success" | "info" | "error";
export type ToastInput = { message: string; variant?: ToastVariant; id?: string; /** null keeps it until closed */ duration?: number | null };
type Toast = Required<Omit<ToastInput, "duration">> & { duration: number | null };

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let counter = 0;
/** Persistent toasts the viewer closed; they stay closed until the next full page load. */
const closedIds = new Set<string>();

function emit() {
  for (const l of listeners) l();
}

export function toast(input: ToastInput | string) {
  const t = typeof input === "string" ? { message: input } : input;
  const id = t.id ?? `toast-${++counter}`;
  const item: Toast = { id, message: t.message, variant: t.variant ?? "success", duration: t.duration === undefined ? 6000 : t.duration };
  toasts = [...toasts.filter((x) => x.id !== id), item].slice(-4);
  emit();
  return id;
}

toast.success = (message: string) => toast({ message, variant: "success" });
toast.error = (message: string) => toast({ message, variant: "error" });
toast.info = (message: string) => toast({ message, variant: "info" });

export function dismissToast(id: string) {
  closedIds.add(id);
  toasts = toasts.filter((x) => x.id !== id);
  emit();
}

const STYLE: Record<ToastVariant, string> = {
  success: "bg-[var(--tc-toast-success-bg)] text-[var(--tc-toast-success-fg)]",
  info: "bg-[var(--tc-toast-info-bg)] text-[var(--tc-toast-info-fg)]",
  error: "bg-[var(--tc-toast-error-bg)] text-[var(--tc-toast-error-fg)]",
};

/** Icons are rendered on the server (root layout) and passed in, so they ship as HTML. */
export type ToastIcons = Record<ToastVariant | "close", ReactNode>;
const IconsContext = createContext<ToastIcons | null>(null);

function ToastItem({ item }: { item: Toast }) {
  const t = useTranslations("common");
  const [paused, setPaused] = useState(false);
  const remaining = useRef(item.duration);
  useEffect(() => {
    if (item.duration === null || paused || remaining.current === null) return;
    const started = Date.now();
    const timer = setTimeout(() => dismissToast(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      if (remaining.current !== null) remaining.current -= Date.now() - started;
    };
  }, [item.id, item.duration, paused]);
  const cls = STYLE[item.variant];
  const icons = useContext(IconsContext);
  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex items-start gap-3 rounded-[8px] py-3 pr-1 pl-4 text-body-sm font-bold ${cls}`}
    >
      <span className="mt-[2px]">{icons?.[item.variant]}</span>
      <p role={item.variant === "error" ? "alert" : "status"} className="flex-1 pt-[1px]">
        {item.message}
      </p>
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        aria-label={t("close")}
        className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] hover:bg-black/5"
      >
        {icons?.close}
      </button>
    </li>
  );
}

/** Renders queued toasts. `initial` toasts show on every page load (for example the sample data notice). */
export function Toaster({ initial = [], icons }: { initial?: ToastInput[]; icons: ToastIcons }) {
  const items = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => toasts,
  );
  const t = useTranslations("common");
  // Re-run when the text changes (for example after switching language), in place and in order.
  const signature = JSON.stringify(initial);
  useEffect(() => {
    for (const item of JSON.parse(signature) as ToastInput[]) {
      if (item.id && closedIds.has(item.id)) continue;
      const existing = toasts.find((x) => x.id === item.id);
      if (existing) {
        toasts = toasts.map((x) => (x.id === item.id ? { ...x, message: item.message } : x));
        emit();
      } else toast(item);
    }
  }, [signature]);
  return (
    <IconsContext.Provider value={icons}>
      <ol
        aria-label={t("notifications")}
        className="no-print pointer-events-none fixed inset-x-4 bottom-[84px] z-[60] flex flex-col gap-2 sm:left-auto sm:w-[400px] lg:right-6 lg:bottom-6"
      >
        {items.map((item) => (
          <ToastItem key={item.id} item={item} />
        ))}
      </ol>
    </IconsContext.Provider>
  );
}
