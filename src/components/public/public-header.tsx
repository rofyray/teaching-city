import { SignpostIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/icon";
import { PublicNav } from "./public-nav";

export async function PublicHeader() {
  const t = await getTranslations("common");
  return (
    <header className="sign no-print relative bg-ink text-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-10">
        <Link href="/" className="flex min-h-[44px] items-center gap-2 text-body font-extrabold text-white no-underline">
          <Icon icon={SignpostIcon} weight="bold" size={24} />
          {t("appName")}
        </Link>
        <PublicNav />
      </div>
    </header>
  );
}
