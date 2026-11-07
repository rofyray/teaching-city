import { getTranslations } from "next-intl/server";

export async function SkipLink() {
  const t = await getTranslations("common");
  return (
    <a
      href="#main"
      className="sr-only z-50 bg-surface px-4 py-3 font-bold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
    >
      {t("skipToContent")}
    </a>
  );
}
