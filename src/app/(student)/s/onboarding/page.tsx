import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { asc } from "drizzle-orm";
import { db } from "@/server/db";
import { jobClassifications } from "@/server/db/schema";
import { getStudentArea } from "@/server/queries/student";
import { OnboardingWizard } from "./wizard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("stepWelcome") };
}

export default async function OnboardingPage() {
  const { profile } = await getStudentArea();
  const classes = await db.select({ code: jobClassifications.code, title: jobClassifications.title }).from(jobClassifications).orderBy(asc(jobClassifications.code));
  return (
    <OnboardingWizard
      classificationTitles={Object.fromEntries(classes.map((c) => [c.code, c.title]))}
      initial={{
        major: profile.major ?? "",
        majorCategory: profile.majorCategory ?? "",
        classYear: profile.classYear ?? "",
        availability: profile.availability,
        courses: profile.courses,
      }}
    />
  );
}
