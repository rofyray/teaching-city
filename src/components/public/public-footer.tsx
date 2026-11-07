import { InfoIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/icon";

export async function PublicFooter() {
  const t = await getTranslations("common");
  return (
    <footer className="no-print mt-auto border-t border-rule bg-surface">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-4 py-6 text-body-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-muted">{t("sampleNoteFooter")}</p>
        <Link href="/about/ai" className="inline-flex min-h-[44px] items-center gap-2 font-bold">
          <Icon icon={InfoIcon} weight="regular" size={20} />
          {t("aiDisclosureLink")}
        </Link>
      </div>
    </footer>
  );
}
