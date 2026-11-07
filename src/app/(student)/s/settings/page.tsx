import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/components/language-switch";
import { PageHeader } from "@/components/page-header";
import { SharingControls } from "@/components/share-switch";
import { consentState } from "@/server/authz";
import { getStudentArea } from "@/server/queries/student";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("settings") };
}

export default async function SettingsPage() {
  const { current, profile } = await getStudentArea();
  const t = await getTranslations();
  const consent = await consentState(profile.id);
  return (
    <>
      <PageHeader title={t("nav.settings")} current={current} settingsHref="/s/settings" />
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-4 px-5 py-4 lg:grid-cols-3 lg:gap-6 lg:px-10 lg:py-8">
        <section aria-labelledby="share" className="card p-4">
          <h2 id="share" className="text-subheading font-extrabold">
            {t("sharing.title")}
          </h2>
          <SharingControls initial={{ share_city_hr: consent.share_city_hr, share_vendor_bridge: consent.share_vendor_bridge, public_link: consent.public_link }} />
        </section>
        <section aria-labelledby="lang" className="card p-4">
          <h2 id="lang" className="sr-only">
            {t("common.language")}
          </h2>
          <LanguageSwitch locale={current.locale} />
        </section>
        <section aria-labelledby="acct" className="card p-4">
          <h2 id="acct" className="text-subheading font-extrabold">
            {t("nav.account")}
          </h2>
          <p className="mt-2 text-body font-bold">{current.name}</p>
          <p className="text-body-sm text-muted">{current.email}</p>
        </section>
      </div>
    </>
  );
}
