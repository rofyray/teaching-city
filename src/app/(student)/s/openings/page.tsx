import { BriefcaseIcon, CheckCircleIcon, CircleIcon, HandshakeIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { getInvitesForPoolEntry, getVendorRequestsForStudent } from "@/server/queries/openings";
import { getStudentArea } from "@/server/queries/student";
import { VendorResponse } from "./vendor-response";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("openings");
  return { title: t("title") };
}

export default async function OpeningsPage() {
  const { current, profile, view } = await getStudentArea();
  const t = await getTranslations();
  const locale = await getLocale();
  const tz = view?.program.timeZone ?? "America/Chicago";
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz });
  const requests = await getVendorRequestsForStudent(profile.id);
  const inPool = view?.poolEntry && view.poolEntry.status !== "withdrawn";
  const invites = inPool && view?.poolEntry ? await getInvitesForPoolEntry(view.poolEntry.id) : [];
  const plain = view?.classification?.plainStatus === "approved" ? view.classification.plainSummary : null;
  const missing = view?.derived.eligibility.missing;

  return (
    <>
      <PageHeader title={t("openings.title")} current={current} settingsHref="/s/settings" />
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-4 px-5 py-4 lg:grid-cols-2 lg:gap-6 lg:px-10 lg:py-8">
        {view && view.enrollment.status !== "proposed" ? (
          <section aria-labelledby="status" className="card p-4 border-2 border-line">
            <h2 id="status" className="flex items-center gap-3 text-subheading font-extrabold">
              <Icon icon={HandshakeIcon} weight="duotone" size={28} className="text-line" />
              {inPool ? t("openings.statusInPool") : t("openings.statusNotYet")}
            </h2>
            {inPool ? (
              <p className="mt-2 text-body-sm text-muted">{t("transcript.inPool", { classification: view.classification?.title ?? "" })}</p>
            ) : missing ? (
              <>
                <h3 className="mt-3 text-body-sm font-extrabold">{t("openings.missingTitle")}</h3>
                <ul className="mt-1 flex flex-col gap-1">
                  {[
                    { done: !missing.complete, text: t("openings.missingComplete") },
                    { done: missing.skillsShort === 0, text: t("openings.missingSkills", { count: Math.max(missing.skillsShort, 1) }) },
                    { done: missing.refsShort === 0, text: t("openings.missingRefs", { count: Math.max(missing.refsShort, 1) }) },
                    { done: !missing.consent, text: t("openings.missingConsent") },
                  ]
                    .filter((m) => !m.done)
                    .map((m) => (
                      <li key={m.text} className="flex items-center gap-2 text-body-sm">
                        <Icon icon={CircleIcon} weight="bold" size={16} className="text-muted" />
                        {m.text}
                      </li>
                    ))}
                </ul>
              </>
            ) : null}
            {invites.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {invites.map(({ invite, opening }) => (
                  <li key={invite.id} className="rounded-[8px] bg-line-tint p-3">
                    <p className="flex items-center gap-2 text-body font-extrabold">
                      <Icon icon={CheckCircleIcon} weight="fill" size={20} className="text-line" />
                      {invite.offerAt ? t("openings.statusOffered", { opening: opening.title }) : t("openings.statusInvited", { opening: opening.title })}
                    </p>
                    {invite.interviewAt && !invite.offerAt ? (
                      <p className="mt-1 text-body-sm text-muted">{t("openings.interviewOn", { date: fmt.format(invite.interviewAt) })}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {plain && view?.classification ? (
          <section aria-labelledby="role" className="card p-4">
            <h2 id="role" className="text-subheading font-extrabold">
              {t("openings.aboutRole", { classification: view.classification.title })}
            </h2>
            <p className="mt-1 flex items-center gap-1 text-caption font-bold text-muted">
              <Icon icon={SealCheckIcon} weight="fill" size={16} className="text-line" />
              {t("openings.reviewedByCity")}
            </p>
            <p className="mt-2 text-body">{plain.summary}</p>
            <h3 className="mt-3 text-body-sm font-extrabold">{t("openings.dayToDay")}</h3>
            <ul className="mt-1 list-disc pl-5 text-body-sm">
              {plain.dayToDay.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <h3 className="mt-3 text-body-sm font-extrabold">{t("openings.whatYouNeed")}</h3>
            <ul className="mt-1 list-disc pl-5 text-body-sm">
              {plain.whatYouNeed.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {requests.length > 0 ? (
          <section aria-labelledby="vendors" className="card p-4">
            <h2 id="vendors" className="text-subheading font-extrabold">
              {t("openings.vendorRequests")}
            </h2>
            <ul className="mt-2">
              {requests.map(({ interest, vendorName }) => (
                <li key={interest.id} className="flex flex-col gap-2 border-t border-rule py-3">
                  <p className="text-body font-bold">{t("notifications.vendorRequest", { vendor: vendorName })}</p>
                  {interest.studentResponse === "pending" ? (
                    <VendorResponse interestId={interest.id} />
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill variant={interest.studentResponse === "accepted" ? "confirmed" : "asked"}>
                        {interest.studentResponse === "accepted" ? t("openings.accept") : t("openings.decline")}
                      </StatusPill>
                      {interest.interviewAt ? <span className="text-body-sm text-muted">{t("openings.interviewOn", { date: fmt.format(interest.interviewAt) })}</span> : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!inPool && requests.length === 0 && !plain && (!view || view.enrollment.status === "proposed") ? (
          <EmptyState icon={BriefcaseIcon} title={t("openings.emptyTitle")} body={t("openings.emptyBody")} />
        ) : null}
      </div>
    </>
  );
}
