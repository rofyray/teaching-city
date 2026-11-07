"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { CheckIcon, GearIcon, SignOutIcon, TranslateIcon, UserCircleIcon, UserSwitchIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { setActiveRole, setLocale } from "@/server/actions/account";
import type { Role } from "@/server/db/schema";
import { Icon } from "./icon";

const itemClass =
  "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[6px] px-3 text-body-sm font-semibold text-ink outline-none data-[highlighted]:bg-ground";

export function AccountMenu({
  name,
  roles,
  activeRole,
  locale,
  settingsHref,
}: {
  name: string;
  roles: Role[];
  activeRole: Role | null;
  locale: "en" | "es";
  settingsHref?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={name}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
      >
        <Icon icon={UserCircleIcon} weight="bold" size={24} />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content align="end" sideOffset={6} className="z-50 min-w-[240px] rounded-[8px] bg-surface p-1 outline-rule">
          <Dropdown.Label className="px-3 py-2 text-caption font-bold text-muted">{name}</Dropdown.Label>
          {roles.length > 1 ? (
            <Dropdown.Group>
              <Dropdown.Label className="flex items-center gap-2 px-3 pt-2 pb-1 text-micro font-extrabold text-muted">
                <Icon icon={UserSwitchIcon} weight="bold" size={16} />
                {t("common.switchRole")}
              </Dropdown.Label>
              {roles.map((role) => (
                <Dropdown.Item key={role} className={itemClass} onSelect={() => startTransition(() => setActiveRole(role))}>
                  <span className="w-4">{role === activeRole ? <Icon icon={CheckIcon} weight="bold" size={16} /> : null}</span>
                  {t(`roles.${role}`)}
                </Dropdown.Item>
              ))}
              <Dropdown.Separator className="my-1 h-px bg-rule" />
            </Dropdown.Group>
          ) : null}
          <Dropdown.Label className="flex items-center gap-2 px-3 pt-2 pb-1 text-micro font-extrabold text-muted">
            <Icon icon={TranslateIcon} weight="bold" size={16} />
            {t("common.language")}
          </Dropdown.Label>
          {(["en", "es"] as const).map((l) => (
            <Dropdown.Item
              key={l}
              className={itemClass}
              onSelect={() =>
                startTransition(async () => {
                  await setLocale(l);
                  router.refresh();
                })
              }
            >
              <span className="w-4">{l === locale ? <Icon icon={CheckIcon} weight="bold" size={16} /> : null}</span>
              <span lang={l}>{l === "en" ? t("common.english") : t("common.spanish")}</span>
            </Dropdown.Item>
          ))}
          <Dropdown.Separator className="my-1 h-px bg-rule" />
          {settingsHref ? (
            <Dropdown.Item className={itemClass} onSelect={() => router.push(settingsHref)}>
              <Icon icon={GearIcon} weight="bold" size={18} />
              {t("nav.settings")}
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item
            className={itemClass}
            onSelect={() =>
              startTransition(async () => {
                await authClient.signOut();
                router.push("/");
                router.refresh();
              })
            }
          >
            <Icon icon={SignOutIcon} weight="bold" size={18} />
            {t("common.signOut")}
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
