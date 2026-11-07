"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "../db";
import { appState, notifications } from "../db/schema";
import { optOutKey } from "../email";
import { safeHref } from "../notifications-text";
import { requireUser } from "../session";

/** Marks one notification read and follows its link. */
export async function openNotification(id: string) {
  const current = await requireUser();
  const nid = z.string().min(1).parse(id);
  const [row] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, nid), eq(notifications.userId, current.id)))
    .limit(1);
  if (!row) redirect("/notifications");
  if (!row.readAt) await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, row.id));
  revalidatePath("/", "layout");
  redirect(safeHref(row.payload.href));
}

export async function markAllRead() {
  const current = await requireUser();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, current.id), isNull(notifications.readAt)));
  revalidatePath("/", "layout");
}

/** P13.3 unsubscribe: stops notification emails for this user; in-app notices continue. */
export async function unsubscribeEmails() {
  const current = await requireUser();
  await db
    .insert(appState)
    .values({ key: optOutKey(current.id), value: "true" })
    .onConflictDoUpdate({ target: appState.key, set: { value: "true" } });
  redirect("/notifications?unsubscribed=1");
}
