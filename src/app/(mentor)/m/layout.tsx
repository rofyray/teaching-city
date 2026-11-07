import type { ReactNode } from "react";
import { requireRole } from "@/server/session";

export default async function MentorRootLayout({ children }: { children: ReactNode }) {
  await requireRole("preceptor", "sponsor");
  return <>{children}</>;
}
