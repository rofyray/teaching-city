import { LinkIcon } from "@phosphor-icons/react/ssr";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";

export default async function SharedLinkGone() {
  const t = await getTranslations();
  return (
    <main id="main" className="mx-auto w-full max-w-[560px] px-4 py-10">
      <h1 className="sr-only">{t("transcript.title")}</h1>
      <EmptyState icon={LinkIcon} title={t("errors.notFound")} body={t("transcript.linkGone")} />
    </main>
  );
}
