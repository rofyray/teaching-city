import type { CSSProperties } from "react";
import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";

type Props = {
  icon: PhosphorIcon;
  weight?: IconWeight;
  size?: number;
  /** When set, the icon is announced with this label; otherwise it is hidden from assistive tech. */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/** Every icon is decorative unless it carries a label (Section 9.4). */
export function Icon({ icon: Glyph, weight = "regular", size = 24, label, className, style }: Props) {
  return (
    <Glyph
      weight={weight}
      size={size}
      className={className}
      style={{ flexShrink: 0, display: "block", ...style }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
    />
  );
}
