"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n/request";
import { db } from "../db";
import { user, type Role } from "../db/schema";
import { getCurrentUser, ROLE_COOKIE, ROLE_HOME } from "../session";

export async function setActiveRole(role: Role) {
  const current = await getCurrentUser();
  if (!current || !current.roles.includes(role)) return;
  (await cookies()).set(ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  redirect(ROLE_HOME[role]);
}

export async function setLocale(locale: Locale) {
  const value: Locale = locale === "es" ? "es" : "en";
  (await cookies()).set(LOCALE_COOKIE, value, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  const current = await getCurrentUser();
  if (current) await db.update(user).set({ locale: value }).where(eq(user.id, current.id));
}
