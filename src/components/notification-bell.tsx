import { BellIcon } from "@phosphor-icons/react/ssr";
import { and, count, eq, isNull } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";
import { Icon } from "./icon";

export async function NotificationBell({ userId }: { userId: string }) {
  const t = await getTranslations("common");
  const [{ unread }] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return (
    <Link
      href="/notifications"
      aria-label={unread ? `${t("notifications")}, ${unread}` : t("notifications")}
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
    >
      <Icon icon={BellIcon} weight="bold" size={24} />
      {unread ? (
        <span
          aria-hidden="true"
          className="tabular absolute top-1 right-1 min-w-[18px] rounded-full bg-due-tint px-1 text-center text-micro font-extrabold text-due"
        >
          {unread}
        </span>
      ) : null}
    </Link>
  );
}
