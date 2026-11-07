import { BellIcon, CaretLeftIcon } from "@phosphor-icons/react/ssr";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { HeaderActions } from "@/components/header-actions";
import { Icon } from "@/components/icon";
import { SignBand } from "@/components/sign-band";
import { vendorCopy } from "@/content/vendor-copy";
import { markAllRead, openNotification, unsubscribeEmails } from "@/server/actions/notifications";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";
import { notificationText } from "@/server/notifications-text";
import { homeFor, requireUser } from "@/server/session";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return { title: t("title") };
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const current = await requireUser();
  const params = await searchParams;
  const t = await getTranslations();
  const locale = await getLocale();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, current.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  const hasUnread = rows.some((r) => !r.readAt);
  const when = new Intl.DateTimeFormat(locale, { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SignBand
        title={t("notifications.title")}
        leading={
          <Link href={homeFor(current)} aria-label={t("common.back")} className="-ml-2 inline-flex h-11 w-11 items-center justify-center text-white">
            <Icon icon={CaretLeftIcon} weight="bold" size={24} />
          </Link>
        }
        action={
          <div className="flex items-center">
            <HeaderActions current={current} />
          </div>
        }
      />
      <main id="main" className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6">
        {params.unsubscribe === "1" ? (
          <form action={unsubscribeEmails} className="card mb-4 flex flex-wrap items-center justify-between gap-3 p-4 outline-rule">
            <p className="text-body font-bold">{vendorCopy(locale, "unsubscribeTitle")}</p>
            <button type="submit" className="inline-flex min-h-[44px] items-center rounded-[8px] bg-ink px-4 text-body-sm font-extrabold text-white">
              {vendorCopy(locale, "unsubscribeConfirm")}
            </button>
          </form>
        ) : null}
        {params.unsubscribed === "1" ? (
          <p role="status" className="card mb-4 p-4 text-body-sm font-semibold outline-rule">
            {vendorCopy(locale, "unsubscribeDone")}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <EmptyState icon={BellIcon} title={t("notifications.title")} body={t("notifications.empty")} />
        ) : (
          <>
            {hasUnread ? (
              <form action={markAllRead} className="mb-3 flex justify-end">
                <button type="submit" className="inline-flex min-h-[44px] items-center rounded-[8px] px-3 text-body-sm font-bold outline-rule">
                  {vendorCopy(locale, "markAllRead")}
                </button>
              </form>
            ) : null}
            <ul className="card overflow-hidden">
              {rows.map((row, i) => {
                const text = notificationText(locale, row.type, row.payload);
                if (!text) return null;
                const unread = !row.readAt;
                return (
                  <li key={row.id} className={cn(i > 0 && "border-t border-rule")}>
                    <form action={openNotification.bind(null, row.id)}>
                      <button
                        type="submit"
                        className={cn(
                          "flex min-h-[56px] w-full items-start gap-3 px-4 py-3 text-left text-body text-ink underline-offset-2 hover:underline",
                          unread ? "font-extrabold" : "font-normal text-muted",
                        )}
                      >
                        <span aria-hidden="true" className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", unread ? "bg-due" : "bg-transparent")} />
                        <span className="flex flex-1 flex-col">
                          <span>
                            {unread ? <span className="sr-only">{vendorCopy(locale, "unread")}: </span> : null}
                            {text}
                          </span>
                          <span className="text-caption font-semibold text-muted">{when.format(row.createdAt)}</span>
                        </span>
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
