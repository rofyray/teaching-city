import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isDemoMode } from "@/server/auth";
import { PERSONAS } from "@/server/personas";
import { PersonaButton, ResetDemoButton } from "./persona-controls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("demo");
  return { title: t("title") };
}

const NAMES: Record<string, string> = {
  student: "Amara Okafor",
  preceptor: "Dana Ortiz",
  sponsor: "Marcus Hill",
  city: "Renee Carter",
  college: "Omar Patel",
  vendor: "Kim Nguyen",
  completer: "Luis Herrera",
};

export default async function DemoPage() {
  if (!isDemoMode()) notFound();
  const t = await getTranslations("demo");
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="text-display font-extrabold">{t("title")}</h1>
      <p className="mt-2 text-body text-muted">{t("lead")}</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((p, i) => {
          const key = p.key as "student";
          return (
            <li key={p.key} data-line={p.line} data-reveal="rise" style={{ ["--i" as string]: i }} className="card flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-line-tint text-body font-extrabold text-line-ink"
                >
                  {p.initials}
                </span>
                <div className="flex min-w-0 flex-col items-start gap-1">
                  <h2 className="text-subheading font-extrabold">{NAMES[p.key]}</h2>
                  <span className="rounded-[12px] bg-line-tint px-[10px] py-[2px] text-micro font-extrabold text-line-ink">{t(key)}</span>
                </div>
              </div>
              <p className="flex-1 text-body-sm text-muted">{t(`${key}Detail`)}</p>
              <PersonaButton personaKey={p.key} label={t("enter")} accessibleName={t("enterAs", { name: NAMES[p.key] })} />
            </li>
          );
        })}
      </ul>
      <div className="mt-8 border-t border-rule pt-6">
        <ResetDemoButton />
      </div>
    </div>
  );
}
