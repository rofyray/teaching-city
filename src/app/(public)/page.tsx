import type { Metadata } from "next";
import Link from "next/link";
import { FourPartRoute } from "@/components/public/four-part-route";
import { landing } from "@/content/landing";

export const metadata: Metadata = {
  title: { absolute: `Teaching City: ${landing.title}` },
};

export default function LandingPage() {
  return (
    <>
      <div className="sign print-sign bg-ink text-white">
        <div className="mx-auto max-w-[1120px] px-4 pt-10 pb-12 sm:px-6 sm:pt-16 sm:pb-16">
          <h1 className="max-w-[18ch] text-[34px] leading-[38px] font-extrabold sm:text-display">{landing.title}</h1>
          <p className="mt-5 max-w-[64ch] text-body text-sign-muted">{landing.lead}</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/demo"
            className="inline-flex min-h-[48px] items-center rounded-[8px] bg-ink px-6 text-body font-extrabold text-white no-underline"
          >
            {landing.primaryAction}
          </Link>
          <Link href="/how-it-works" className="inline-flex min-h-[44px] items-center text-body font-bold">
            {landing.secondaryLink}
          </Link>
        </div>

        <section aria-labelledby="barrier" className="max-w-[72ch]">
          <h2 id="barrier" className="text-title font-extrabold">
            {landing.barrier.heading}
          </h2>
          <p className="mt-3 text-body">{landing.barrier.body}</p>
        </section>

        <section aria-labelledby="route" className="card p-5 sm:p-8">
          <h2 id="route" className="mb-6 text-title font-extrabold">
            {landing.route.heading}
          </h2>
          <FourPartRoute stations={landing.route.stations} label={landing.route.heading} />
        </section>

        <section aria-labelledby="why-now" className="max-w-[72ch]">
          <h2 id="why-now" className="text-title font-extrabold">
            {landing.whyNow.heading}
          </h2>
          <p className="mt-3 text-body">{landing.whyNow.body}</p>
        </section>
      </div>
    </>
  );
}
