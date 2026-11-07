import "server-only";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { vendorCopy } from "@/content/vendor-copy";
import { db } from "./db";
import { appState, user } from "./db/schema";
import { notificationText, safeHref } from "./notifications-text";

export const optOutKey = (userId: string) => `email_optout:${userId}`;

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY && process.env.DEMO_MODE !== "true";
}

function baseUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/**
 * P13.3: email the same notice when RESEND_API_KEY is set and demo mode is off.
 * Never sends in demo mode. Each email carries an unsubscribe link.
 */
export async function sendNotificationEmail(
  userId: string,
  type: string,
  payload: Record<string, string | number>,
): Promise<{ sent: boolean }> {
  if (!emailEnabled()) return { sent: false };
  const [row] = await db.select({ email: user.email, locale: user.locale }).from(user).where(eq(user.id, userId)).limit(1);
  if (!row) return { sent: false };
  const [optOut] = await db.select().from(appState).where(eq(appState.key, optOutKey(userId))).limit(1);
  if (optOut?.value === "true") return { sent: false };
  const text = notificationText(row.locale, type, payload);
  if (!text) return { sent: false };
  const url = baseUrl();
  const body = [
    text,
    "",
    `${url}${safeHref(payload.href)}`,
    "",
    vendorCopy(row.locale, "emailUnsubscribe", { url: `${url}/notifications?unsubscribe=1` }),
  ].join("\n");
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.EMAIL_FROM ?? "Teaching City <onboarding@resend.dev>",
      to: row.email,
      subject: text,
      text: body,
    });
    return { sent: true };
  } catch (error) {
    console.error(JSON.stringify({ event: "email_error", type, message: error instanceof Error ? error.message : String(error) }));
    return { sent: false };
  }
}
