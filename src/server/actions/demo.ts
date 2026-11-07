"use server";

import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth, isDemoMode } from "../auth";
import { db } from "../db";
import { appState } from "../db/schema";
import { seed } from "../seed";
import { PERSONAS } from "../personas";
import { ROLE_COOKIE } from "../session";

export async function signInAsPersona(key: string) {
  if (!isDemoMode()) notFound();
  const persona = PERSONAS.find((p) => p.key === key);
  if (!persona) notFound();
  await auth.api.demoSignIn({ body: { email: persona.email }, headers: await headers() });
  (await cookies()).set(ROLE_COOKIE, persona.role, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(persona.home);
}

const RESET_KEY = "demo_reset_at";
const RESET_WINDOW_MS = 10 * 60 * 1000;

export async function resetDemoData(): Promise<{ status: "done" | "wait" }> {
  if (!isDemoMode()) notFound();
  const [row] = await db.select().from(appState).where(eq(appState.key, RESET_KEY)).limit(1);
  const now = new Date();
  if (row && now.getTime() - new Date(row.value).getTime() < RESET_WINDOW_MS) return { status: "wait" };
  await db
    .insert(appState)
    .values({ key: RESET_KEY, value: now.toISOString() })
    .onConflictDoUpdate({ target: appState.key, set: { value: now.toISOString() } });
  await seed(db, now);
  return { status: "done" };
}
