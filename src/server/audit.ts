import "server-only";
import type { Db } from "./db";
import { db as defaultDb } from "./db";
import { auditLog, notifications } from "./db/schema";

type Tx = Pick<Db, "insert">;

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {},
  tx: Tx = defaultDb,
) {
  await tx.insert(auditLog).values({ actorId, action, entity, entityId, meta });
}

export type NotificationType =
  | "matchConfirmed"
  | "ratingDue"
  | "ratingPosted"
  | "hoursReminder"
  | "referenceRequest"
  | "referenceConfirmed"
  | "poolEntered"
  | "invited"
  | "vendorRequest"
  | "invitePastTarget";

export async function notify(userId: string, type: NotificationType, payload: Record<string, string | number>, tx: Tx = defaultDb) {
  await tx.insert(notifications).values({ userId, type, payload });
}
