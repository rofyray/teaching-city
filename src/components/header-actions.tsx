import type { CurrentUser } from "@/server/session";
import { AccountMenu } from "./account-menu";
import { NotificationBell } from "./notification-bell";

export function HeaderActions({ current, settingsHref }: { current: CurrentUser; settingsHref?: string }) {
  return (
    <>
      <NotificationBell userId={current.id} />
      <AccountMenu
        name={current.name}
        roles={current.roles}
        activeRole={current.activeRole}
        locale={current.locale}
        settingsHref={settingsHref}
      />
    </>
  );
}
