import type { Metadata } from "next";
import Link from "next/link";
import { FourPartRoute } from "@/components/public/four-part-route";
import { HeroLines } from "@/components/public/hero-lines";
import { landing } from "@/content/landing";

export const metadata: Metadata = {
  title: { absolute: `Teaching City: ${landing.title.join(" ")}` },
};

const LINE_KEYS = ["finance", "works", "tech", "community", "info"];

export default function LandingPage() {
  return (
    <>
      <section aria-labelledby="hero" className="sign print-sign overflow-hidden bg-ink text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-14 pb-6 sm:px-6 sm:pt-24 lg:px-10">
          <h1 id="hero" className="text-[40px] leading-[44px] font-extrabold sm:text-[64px] sm:leading-[68px] lg:text-[80px] lg:leading-[84px]">
            <span className="anim-rise block" style={{ ["--i" as string]: 0 }}>
              {landing.title[0]}
            </span>
            <span className="anim-rise block text-sign-muted" style={{ ["--i" as string]: 2 }}>
              {landing.title[1]}
            </span>
          </h1>
          <p className="anim-rise max-w-[760px] text-[18px] leading-[28px] text-sign-muted sm:text-[20px] sm:leading-[30px]" style={{ ["--i" as string]: 4 }}>
            {landing.lead}
          </p>
          <div className="anim-rise flex flex-wrap items-center gap-3 pt-2" style={{ ["--i" as string]: 5 }}>
            <Link
              href="/demo"
              className="inline-flex min-h-[52px] items-center rounded-[8px] bg-white px-8 text-[17px] font-extrabold text-ink no-underline hover:bg-ground"
            >
              {landing.primaryAction}
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-[52px] items-center rounded-[8px] px-6 text-[17px] font-bold text-white no-underline shadow-[inset_0_0_0_2px_rgba(255,255,255,0.5)] hover:shadow-[inset_0_0_0_2px_#fff]"
            >
              {landing.secondaryLink}
            </Link>
          </div>
        </div>
        <HeroLines />
      </section>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-14 px-4 py-14 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <section aria-labelledby="barrier" data-reveal="rise">
            <h2 id="barrier" className="text-title font-extrabold">
              {landing.barrier.heading}
            </h2>
            <p className="mt-3 text-[18px] leading-[28px]">{landing.barrier.body}</p>
          </section>
          <section aria-labelledby="why-now" data-reveal="rise" style={{ ["--i" as string]: 1 }}>
            <h2 id="why-now" className="text-title font-extrabold">
              {landing.whyNow.heading}
            </h2>
            <p className="mt-3 text-[18px] leading-[28px]">{landing.whyNow.body}</p>
          </section>
        </div>

        <section aria-labelledby="route" className="card p-5 sm:p-8">
          <h2 id="route" className="mb-8 text-title font-extrabold">
            {landing.route.heading}
          </h2>
          <FourPartRoute stations={landing.route.stations} label={landing.route.heading} />
        </section>

        <section aria-labelledby="semester">
          <h2 id="semester" className="text-title font-extrabold">
            {landing.semester.heading}
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {landing.semester.steps.map((step, i) => (
              <li
                key={step.who}
                data-reveal="rise"
                data-line={LINE_KEYS[i]}
                style={{ ["--i" as string]: i }}
                className="card flex flex-col gap-2 p-5 shadow-[inset_0_4px_0_var(--tc-line)]"
              >
                <span className="text-caption font-extrabold text-line-ink">{step.who}</span>
                <p className="text-body">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="cta" data-reveal="rise" className="sign rounded-[8px] bg-ink p-8 text-white sm:p-12">
          <h2 id="cta" className="text-[28px] leading-[32px] font-extrabold sm:text-[36px] sm:leading-[40px]">
            {landing.cta.heading}
          </h2>
          <p className="mt-3 text-[18px] leading-[28px] text-sign-muted">{landing.cta.body}</p>
          <Link
            href="/demo"
            className="mt-6 inline-flex min-h-[52px] items-center rounded-[8px] bg-white px-8 text-[17px] font-extrabold text-ink no-underline hover:bg-ground"
          >
            {landing.cta.action}
          </Link>
        </section>
      </div>
    </>
  );
}
