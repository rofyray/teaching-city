import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/server/auth";
import { getCurrentUser, homeFor } from "@/server/session";
import { LanguageSwitch } from "@/components/language-switch";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signInTitle") };
}

export default async function SignInPage() {
  const current = await getCurrentUser();
  if (current) redirect(homeFor(current));
  const t = await getTranslations("auth");
  const locale = (await getLocale()) as "en" | "es";
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-10">
      <h1 className="text-title font-extrabold">{t("signInTitle")}</h1>
      <div className="card mt-6 p-5">
        <SignInForm />
      </div>
      <div className="mt-6 flex flex-col gap-4">
        <LanguageSwitch locale={locale} />
        {isDemoMode() ? (
          <Link href="/demo" className="inline-flex min-h-[44px] items-center text-body font-bold">
            {t("demoLink")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
