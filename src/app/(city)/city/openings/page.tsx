import { BriefcaseIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate, formatDateTime, isoDate } from "@/components/city/format";
import { InviteDates, InviteForm, NewOpeningForm } from "@/components/city/opening-forms";
import { PageTitle, pageWrap } from "@/components/city/page-title";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { CITY_COPY, pick } from "@/content/city-copy";
import { timeToOfferDays } from "@/domain/rules";
import { daysBetween, localDate } from "@/domain/time";
import { listClassifications, listOpenings, listPool, listUnits } from "@/server/queries/city";
import { getProgram } from "@/server/queries/enrollment";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("openingsAdmin");
  return { title: t("title") };
}

export default async function OpeningsPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const [program, rows, classes, pool, units] = await Promise.all([getProgram(), listOpenings(), listClassifications(), listPool(), listUnits()]);
  const tz = program.timeZone;
  const today = localDate(new Date(), tz);

  return (
    <div className={pageWrap}>
      <PageTitle title={t("openingsAdmin.title")}>
        <NewOpeningForm
          classifications={classes.map((c) => ({
            id: c.cls.id,
            label: c.cls.title,
            department: units.find((u) => u.id === c.cls.unitId)?.department ?? "",
          }))}
          labels={{ title: pick(CITY_COPY.title, locale), department: pick(CITY_COPY.department, locale) }}
        />
      </PageTitle>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={BriefcaseIcon} title={pick(CITY_COPY.noOpenings, locale)} body={pick(CITY_COPY.noOpeningsBody, locale)} />
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {rows.map(({ opening, classification, invites }) => {
            const invitedIds = invites.map((i) => i.invite.poolEntryId);
            const candidates = pool
              .filter((p) => p.classificationId === opening.classificationId && p.status === "active" && !invitedIds.includes(p.id))
              .map((p) => ({ id: p.id, name: p.name }));
            return (
              <li key={opening.id} className="card flex flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-subheading font-extrabold">{opening.title}</h2>
                    <p className="text-caption text-muted">
                      {[classification, opening.department, formatDate(opening.postedAt, locale)].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <StatusPill variant={opening.status === "open" ? "confirmed" : "neutral"}>{pick(CITY_COPY.openingStatus[opening.status], locale)}</StatusPill>
                </div>
                {invites.length > 0 ? (
                  <ul className="flex flex-col">
                    {invites.map(({ invite, name, enteredAt }) => {
                      const days = invite.offerAt ? timeToOfferDays(enteredAt, invite.offerAt, tz) : null;
                      const waiting = daysBetween(localDate(enteredAt, tz), today);
                      const past = days === null && !invite.declinedAt && waiting > program.offerTargetDays;
                      return (
                        <li key={invite.id} className="flex flex-col gap-3 border-t border-rule py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-body font-bold">{name}</span>
                            <StatusPill variant="neutral">
                              {t("openingsAdmin.invited")} {formatDate(invite.invitedAt, locale)}
                            </StatusPill>
                            {invite.interviewAt ? (
                              <span className="text-caption text-muted">
                                {t("openingsAdmin.interview")}: {formatDateTime(invite.interviewAt, locale)}
                              </span>
                            ) : null}
                            {days !== null ? (
                              <StatusPill variant={days <= program.offerTargetDays ? "confirmed" : "due"}>
                                {t("openingsAdmin.timeToOffer", { days })}
                              </StatusPill>
                            ) : null}
                            {past ? <StatusPill variant="due">{t("openingsAdmin.pastTarget", { days: program.offerTargetDays })}</StatusPill> : null}
                            {invite.acceptedAt ? <StatusPill variant="ink">{t("openingsAdmin.accepted")}</StatusPill> : null}
                            {invite.declinedAt ? <StatusPill variant="asked">{t("openingsAdmin.declined")}</StatusPill> : null}
                          </div>
                          {!invite.acceptedAt && !invite.declinedAt ? (
                            <InviteDates
                              inviteId={invite.id}
                              name={name}
                              interview={isoDate(invite.interviewAt)}
                              offer={isoDate(invite.offerAt)}
                              canDecide={!!invite.offerAt}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {opening.status === "open" ? (
                  <InviteForm openingId={opening.id} candidates={candidates} emptyLabel={pick(CITY_COPY.noOneToInvite, locale)} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
