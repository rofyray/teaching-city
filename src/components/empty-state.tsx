import type { ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Icon } from "./icon";

export function EmptyState({ icon, title, body, action }: { icon: PhosphorIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
      <Icon icon={icon} weight="thin" size={48} className="text-muted" />
      <h2 className="text-subheading font-extrabold">{title}</h2>
      <p className="max-w-prose text-body-sm text-muted">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
