import { SealCheckIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { requestReferenceDetails } from "@/server/actions/mentor";
import { getReferenceRequests } from "@/server/queries/mentor";
import { requireRole } from "@/server/session";
import { ReferenceForm } from "./reference-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("references");
  return { title: t("title") };
}

export default async function ReferencesPage() {
  const current = await requireRole("preceptor", "sponsor");
  const t = await getTranslations();
  const requests = await getReferenceRequests(current.id);
  return (
    <>
      <PageHeader title={t("references.title")} current={current} />
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-4 px-4 py-5 md:grid-cols-2 lg:gap-6 lg:px-10 lg:py-8">
        {requests.length === 0 ? (
          <EmptyState icon={SealCheckIcon} title={t("references.title")} body={t("references.empty")} />
        ) : (
          requests.map(({ reference, name }) => {
            const firstName = name.split(" ")[0];
            return (
              <article key={reference.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-subheading font-extrabold">
                    {reference.status === "confirmed" ? <Icon icon={SealCheckIcon} weight="fill" size={20} className="text-line" /> : null}
                    {name}
                  </h2>
                  <StatusPill variant={reference.status === "confirmed" ? "confirmed" : "asked"}>{t(`people.${reference.status}`)}</StatusPill>
                </div>
                {reference.status === "asked" ? (
                  <div className="mt-2 text-body-sm">
                    {!reference.detailsRequestedAt ? (
                      <ActionButton
                        action={requestReferenceDetails.bind(null, reference.id)}
                        label={t("references.askDetails", { firstName })}
                        successMessage={t("references.detailsAsked", { firstName })}
                      />
                    ) : reference.detailsConfirmedAt ? (
                      <p className="font-bold text-line">{t("references.detailsDone", { firstName })}</p>
                    ) : (
                      <p className="font-bold text-muted">{t("references.detailsWaiting", { firstName })}</p>
                    )}
                  </div>
                ) : null}
                {reference.status === "asked" ? (
                  <ReferenceForm referenceId={reference.id} firstName={firstName} />
                ) : reference.quote ? (
                  <p className="mt-2 text-body text-muted">{reference.quote}</p>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
