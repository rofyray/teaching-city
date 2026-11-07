import { cn } from "@/lib/cn";
import { StatusPill } from "./status-pill";

export const levelCell: Record<number, string> = {
  1: "bg-level-1 text-ink",
  2: "bg-level-2 text-ink",
  3: "bg-level-3 text-white",
  4: "bg-level-4 text-white",
};

export function LevelPill({ level, label, className }: { level: number; label: string; className?: string }) {
  return (
    <StatusPill variant={`level${level}` as "level1"} className={cn(className)}>
      {label}
    </StatusPill>
  );
}
