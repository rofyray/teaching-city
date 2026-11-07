import { CheckIcon, GearIcon, SignOutIcon, TranslateIcon, UserCircleIcon, UserSwitchIcon } from "@phosphor-icons/react/ssr";
import type { CurrentUser } from "@/server/session";
import { AccountMenu } from "./account-menu";
import { Icon } from "./icon";
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
        icons={{
          user: <Icon icon={UserCircleIcon} weight="bold" size={24} />,
          switchRole: <Icon icon={UserSwitchIcon} weight="bold" size={16} />,
          language: <Icon icon={TranslateIcon} weight="bold" size={16} />,
          check: <Icon icon={CheckIcon} weight="bold" size={16} />,
          settings: <Icon icon={GearIcon} weight="bold" size={18} />,
          signOut: <Icon icon={SignOutIcon} weight="bold" size={18} />,
        }}
      />
    </>
  );
}
