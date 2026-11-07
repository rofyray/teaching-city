import { CaretLeftIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { Transcript } from "@/components/transcript";
import { RequestInterviewButton } from "@/components/vendor/request-button";
import { getEnrollmentView, primaryEnrollmentId } from "@/server/queries/enrollment";
import { getFirm, isVisibleToFirm, listVisibleCompleters } from "@/server/queries/vendor";
import { requireRole } from "@/server/session";

type Params = { studentId: string };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("vendorPortal");
  return { title: t("viewRecord") };
}

export default async function VendorStudentPage({ params }: { params: Promise<Params> }) {
  const { studentId } = await params;
  const current = await requireRole("vendor_recruiter");
  const firm = await getFirm(current);
  if (!firm || !(await isVisibleToFirm(studentId, firm))) notFound();
  const enrollmentId = await primaryEnrollmentId(studentId);
  const view = enrollmentId ? await getEnrollmentView(enrollmentId) : null;
  if (!view || view.enrollment.status !== "completed") notFound();
  const t = await getTranslations();
  const card = (await listVisibleCompleters(firm)).find((c) => c.studentId === studentId);

  return (
    <Transcript
      view={view}
      variant="vendor"
      headerActions={
        <Link href="/vendor" className="no-print inline-flex min-h-[44px] items-center gap-1 text-body-sm font-bold text-white">
          <Icon icon={CaretLeftIcon} weight="bold" size={20} />
          {t("nav.vendorStudents")}
        </Link>
      }
      belowHeader={
        <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-5 lg:px-10">
          <RequestInterviewButton studentId={studentId} studentName={view.student.name} pending={card?.pendingRequest ?? false} />
        </div>
      }
    />
  );
}
