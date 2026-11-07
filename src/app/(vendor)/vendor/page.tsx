import { BriefcaseIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { RequestInterviewButton } from "@/components/vendor/request-button";
import { getFirm, listVisibleCompleters } from "@/server/queries/vendor";
import { requireRole } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("vendorPortal");
  return { title: t("title") };
}

export default async function VendorHome() {
  const current = await requireRole("vendor_recruiter");
  const t = await getTranslations();
  const firm = await getFirm(current);
  const completers = firm ? await listVisibleCompleters(firm) : [];

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 lg:px-10">
      <h1 className="text-title font-extrabold">{t("vendorPortal.title")}</h1>
      <p className="mt-1 text-body text-muted">{t("vendorPortal.lead")}</p>
      {completers.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={BriefcaseIcon} title={t("vendorPortal.emptyTitle")} body={t("vendorPortal.emptyBody")} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {completers.map((c) => (
            <li key={c.studentId} className="card flex flex-col gap-2 p-5">
              <h2 className="text-subheading font-extrabold">{c.name}</h2>
              <p className="text-body-sm text-muted">{[c.major, c.school].filter(Boolean).join(", ")}</p>
              <p className="text-body-sm font-semibold">{c.classification}</p>
              <p className="tabular text-caption font-extrabold text-ink">{t("vendorPortal.skillsAtBar", { count: c.atBar })}</p>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                <Link href={`/vendor/students/${c.studentId}`} className="inline-flex min-h-[44px] items-center text-body-sm font-bold underline">
                  {t("vendorPortal.viewRecord")}
                  <span className="sr-only">: {c.name}</span>
                </Link>
                <RequestInterviewButton studentId={c.studentId} studentName={c.name} pending={c.pendingRequest} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
