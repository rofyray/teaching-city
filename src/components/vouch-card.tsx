import { QuotesIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { Icon } from "./icon";

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function VouchCard({ quote, name, title, city }: { quote: string; name: string; title: string | null; city: string }) {
  return (
    <figure className="card print-avoid flex flex-col gap-4 p-5">
      <Icon icon={QuotesIcon} weight="duotone" size={32} className="text-line" />
      <blockquote className="text-[18px] leading-[26px] font-semibold">{quote}</blockquote>
      <figcaption className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-line-tint text-caption font-extrabold text-line-ink"
        >
          {initials(name)}
        </span>
        <span className="flex flex-col">
          <span className="flex items-center gap-1 text-body-sm font-extrabold">
            {name}
            <Icon icon={SealCheckIcon} weight="fill" size={16} className="text-line" />
          </span>
          <span className="text-caption text-muted">{[title, city].filter(Boolean).join(", ")}</span>
        </span>
      </figcaption>
    </figure>
  );
}
