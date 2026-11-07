import { sql } from "drizzle-orm";
import { PDFDocument, StandardFonts } from "pdf-lib";
import seedData from "../../../content/seed-data.json";
import { addDays, localDate, mondayOf, zonedTime } from "@/domain/time";
import type { Db } from "../db";
import * as s from "../db/schema";
import type { MajorCategory } from "../db/schema";

export const CONSENT_VERSION = "2026-11-v1";

type Data = typeof seedData;
type FallStudent = Data["cohorts"]["fall2026"]["students"][number];
type SpringStudent = Data["cohorts"]["spring2026"]["students"][number];

const data: Data = seedData;
const TZ = data.program.timeZone;
const GENERATED_NOTE = "Steady week. Next week, take the lead on one task.";

export function slug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export const userId = (email: string) => `u_${email.split("@")[0].replace(/\./g, "-")}`;
export const staffEmail = (name: string) => `${slug(name)}@westbrook.example.gov`;
export const studentEmail = (name: string, college: string) => `${slug(name)}@${college}.example.edu`;
export const enrollmentIdFor = (name: string, term: "fall" | "spring") => `enr_${term}_${slug(name).replace(/\./g, "-")}`;
const profileIdFor = (name: string) => `sp_${slug(name).replace(/\./g, "-")}`;

export const PROGRAM_ID = "prog_westbrook";
export const CITY_ORG_ID = "org_city_westbrook";
const collegeOrgId = (key: string) => `org_${key}`;
const vendorOrgId = (name: string) => `org_vendor_${slug(name).replace(/\./g, "-")}`;
const unitId = (key: string) => `unit_${key}`;
const classificationId = (code: string) => `cls_${code}`;
const competencyId = (code: string, position: number) => `cmp_${code}_${position}`;

/** Fall startDate: the Monday five weeks before this week's Monday, so today is in week 6. */
export function fallStartDate(now: Date): string {
  return addDays(mondayOf(localDate(now, TZ)), -35);
}

async function samplePdf(title: string, pages: number): Promise<string> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setCreationDate(new Date("2026-01-01T00:00:00Z"));
  pdf.setModificationDate(new Date("2026-01-01T00:00:00Z"));
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = pdf.addPage([612, 792]);
    page.drawText(title, { x: 72, y: 700, size: 18, font: bold });
    page.drawText("Sample work product. Fictional.", { x: 72, y: 670, size: 12, font: regular });
  }
  return Buffer.from(await pdf.save()).toString("base64");
}

const PROGRAM_TABLES = [
  "audit_log",
  "ai_events",
  "notifications",
  "outcome_surveys",
  "vendor_interest",
  "vendor_pledges",
  "opening_invites",
  "openings",
  "pool_entries",
  "share_links",
  "references",
  "sponsor_meetings",
  "sample_files",
  "work_samples",
  "skill_evidence",
  "rating_scores",
  "weekly_ratings",
  "hours_entries",
  "enrollments",
  "consents",
  "student_profiles",
  "competencies",
  "job_classifications",
  "unit_major_map",
  "teaching_units",
  "cohorts",
  "memberships",
  "organizations",
  "programs",
];

type UserRow = typeof s.user.$inferInsert;

function chunk<T>(rows: T[], size = 500): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/**
 * Builds the Westbrook program exactly as Content Pack 13.4 describes, relative to `now`.
 * Deterministic ids keep links and sessions working across resets.
 */
export async function seed(db: Db, now = new Date()) {
  const fallStart = fallStartDate(now);
  const today = localDate(now, TZ);
  const at = (isoDate: string, time = "09:00") => zonedTime(isoDate, time, TZ);
  const fallWeekDay = (week: number, dayOffset: number) => addDays(fallStart, (week - 1) * 7 + dayOffset);
  const springStart = data.cohorts.spring2026.startDate;
  const springWeekDay = (week: number, dayOffset: number) => addDays(springStart, (week - 1) * 7 + dayOffset);

  const users: UserRow[] = [];
  const addUser = (name: string, email: string) => {
    const id = userId(email);
    if (!users.some((u) => u.id === id)) users.push({ id, name, email, emailVerified: true, locale: "en" });
    return id;
  };

  const orgs: (typeof s.organizations.$inferInsert)[] = [
    { id: CITY_ORG_ID, type: "city", name: data.program.city, slug: "city-of-westbrook", cityProgramId: PROGRAM_ID },
    ...data.colleges.map((c) => ({
      id: collegeOrgId(c.key),
      type: "college" as const,
      name: c.name,
      slug: c.key,
      cityProgramId: PROGRAM_ID,
    })),
    ...data.vendors.map((v) => ({
      id: vendorOrgId(v.name),
      type: "vendor" as const,
      name: v.name,
      slug: slug(v.name).replace(/\./g, "-"),
      cityProgramId: PROGRAM_ID,
    })),
  ];

  const memberships: (typeof s.memberships.$inferInsert)[] = [];
  const member = (uid: string, organizationId: string, role: s.Role, title: string | null) =>
    memberships.push({ id: `m_${uid}_${role}_${organizationId}`, userId: uid, organizationId, role, title });

  for (const c of data.coordinators) {
    const uid = addUser(c.name, c.email);
    const org = c.role === "city_coordinator" ? CITY_ORG_ID : collegeOrgId(c.college ?? "wsu");
    member(uid, org, c.role as s.Role, c.title.split(",")[0]);
  }

  const units: (typeof s.teachingUnits.$inferInsert)[] = [];
  const unitMajors: (typeof s.unitMajorMap.$inferInsert)[] = [];
  const classifications: (typeof s.jobClassifications.$inferInsert)[] = [];
  const comps: (typeof s.competencies.$inferInsert)[] = [];
  const staffByName = new Map<string, { id: string; title: string; unitKey: string; role: "sponsor" | "preceptor" }>();

  for (const u of data.units) {
    units.push({
      id: unitId(u.key),
      programId: PROGRAM_ID,
      name: u.name,
      department: u.department,
      lineName: u.line,
      lineLetter: u.letter,
      lineColor: u.color,
      capacity: u.capacity,
      scheduleWindows: u.scheduleWindows,
    });
    for (const m of u.majors) unitMajors.push({ unitId: unitId(u.key), majorCategory: m as MajorCategory });
    classifications.push({
      id: classificationId(u.classification.code),
      programId: PROGRAM_ID,
      unitId: unitId(u.key),
      code: u.classification.code,
      title: u.classification.title,
      rawDescription: u.classification.raw,
      plainStatus: "none",
    });
    u.classification.competencies.forEach((label, i) =>
      comps.push({ id: competencyId(u.classification.code, i + 1), classificationId: classificationId(u.classification.code), position: i + 1, label }),
    );
    const sponsorId = addUser(u.sponsor.name, staffEmail(u.sponsor.name));
    member(sponsorId, CITY_ORG_ID, "sponsor", u.sponsor.title);
    staffByName.set(u.sponsor.name, { id: sponsorId, title: u.sponsor.title, unitKey: u.key, role: "sponsor" });
    for (const p of u.preceptors) {
      const pid = addUser(p.name, staffEmail(p.name));
      member(pid, CITY_ORG_ID, "preceptor", p.title);
      staffByName.set(p.name, { id: pid, title: p.title, unitKey: u.key, role: "preceptor" });
    }
  }

  const vendorPledges: (typeof s.vendorPledges.$inferInsert)[] = [];
  for (const v of data.vendors) {
    const uid = addUser(v.contact, v.email);
    member(uid, vendorOrgId(v.name), "vendor_recruiter", v.contactTitle);
    vendorPledges.push({
      id: `pledge_${slug(v.name).replace(/\./g, "-")}`,
      vendorOrgId: vendorOrgId(v.name),
      programId: PROGRAM_ID,
      contactName: v.contact,
      rolesOffered: v.roles,
      pledgedAt: at("2026-04-01"),
    });
  }

  const unitByKey = new Map(data.units.map((u) => [u.key, u]));
  const cohortId = (term: "fall" | "spring", college: string) => `coh_${term}2026_${college}`;
  const cohorts: (typeof s.cohorts.$inferInsert)[] = [];
  for (const c of data.colleges) {
    cohorts.push({
      id: cohortId("spring", c.key),
      programId: PROGRAM_ID,
      collegeOrgId: collegeOrgId(c.key),
      termName: data.cohorts.spring2026.termName,
      startDate: springStart,
      endDate: data.cohorts.spring2026.endDate,
      status: "completed",
    });
    cohorts.push({
      id: cohortId("fall", c.key),
      programId: PROGRAM_ID,
      collegeOrgId: collegeOrgId(c.key),
      termName: data.cohorts.fall2026.termName,
      startDate: fallStart,
      endDate: addDays(fallStart, 15 * 7 - 3),
      status: "active",
    });
  }

  const profiles: (typeof s.studentProfiles.$inferInsert)[] = [];
  const consents: (typeof s.consents.$inferInsert)[] = [];
  const enrollments: (typeof s.enrollments.$inferInsert)[] = [];
  const hours: (typeof s.hoursEntries.$inferInsert)[] = [];
  const ratings: (typeof s.weeklyRatings.$inferInsert)[] = [];
  const scores: (typeof s.ratingScores.$inferInsert)[] = [];
  const evidence: (typeof s.skillEvidence.$inferInsert)[] = [];
  const samples: (typeof s.workSamples.$inferInsert)[] = [];
  const sampleFiles: (typeof s.sampleFiles.$inferInsert)[] = [];
  const meetings: (typeof s.sponsorMeetings.$inferInsert)[] = [];
  const refs: (typeof s.references.$inferInsert)[] = [];
  const pool: (typeof s.poolEntries.$inferInsert)[] = [];
  const openings: (typeof s.openings.$inferInsert)[] = [];
  const invites: (typeof s.openingInvites.$inferInsert)[] = [];
  const interest: (typeof s.vendorInterest.$inferInsert)[] = [];
  const notifications: (typeof s.notifications.$inferInsert)[] = [];

  const renee = userId(data.coordinators[0].email);

  const consent = (studentId: string, type: s.ConsentType, granted: boolean, when: Date) =>
    consents.push({
      id: `con_${studentId}_${type}`,
      studentId,
      type,
      granted,
      version: CONSENT_VERSION,
      grantedAt: granted ? when : null,
      revokedAt: null,
    });

  const addProfile = (
    name: string,
    college: string,
    major: string,
    category: string,
    firstGenOrPell: boolean,
    onboardedAt: Date,
  ) => {
    const uid = addUser(name, studentEmail(name, college));
    const pid = profileIdFor(name);
    member(uid, collegeOrgId(college), "student", null);
    profiles.push({
      id: pid,
      userId: uid,
      collegeOrgId: collegeOrgId(college),
      major,
      majorCategory: category as MajorCategory,
      preferredLanguage: "en",
      availability: [],
      courses: [],
      firstGen: firstGenOrPell,
      pell: firstGenOrPell,
      adultLearner: null,
      veteran: null,
      onboardedAt,
    });
    return { uid, pid };
  };

  const addRating = (
    enrollmentId: string,
    week: number,
    code: string,
    levels: number[],
    preceptor: { id: string; name: string },
    note: string,
    submittedAt: Date,
  ) => {
    const rid = `rat_${enrollmentId}_${week}`;
    ratings.push({
      id: rid,
      enrollmentId,
      week,
      preceptorId: preceptor.id,
      note,
      noteAiAssisted: false,
      signatureName: preceptor.name,
      signedAt: submittedAt,
      submittedAt,
    });
    levels.forEach((level, i) => scores.push({ ratingId: rid, competencyId: competencyId(code, i + 1), level }));
  };

  // Fall 2026 (active, today is week 6)
  const fallOnboarded = at(addDays(fallStart, -14));
  for (const f of data.cohorts.fall2026.students as FallStudent[]) {
    const unit = unitByKey.get(f.unit)!;
    const code = unit.classification.code;
    const { uid, pid } = addProfile(f.name, f.college, f.major, f.majorCategory, f.firstGenOrPell, fallOnboarded);
    const isAmara = f.name === "Amara Okafor";
    const preceptor = staffByName.get(f.preceptor)!;
    const sponsor = staffByName.get(f.sponsor)!;
    const eid = enrollmentIdFor(f.name, "fall");

    consent(pid, "program_participation", true, fallOnboarded);
    consent(pid, "share_city_hr", true, fallOnboarded);
    consent(pid, "share_vendor_bridge", false, fallOnboarded);
    consent(pid, "public_link", false, fallOnboarded);
    consent(pid, "demographic_reporting", true, fallOnboarded);

    enrollments.push({
      id: eid,
      studentId: pid,
      cohortId: cohortId("fall", f.college),
      unitId: unitId(f.unit),
      classificationId: classificationId(code),
      preceptorId: preceptor.id,
      sponsorId: sponsor.id,
      status: "active",
      startDate: fallStart,
      matchedBy: renee,
      matchReason: isAmara ? data.amara.matchReason : null,
    });

    const lastApproved = isAmara ? data.amara.hoursApprovedThroughWeek : 5;
    for (const [w, h] of Object.entries(f.hours)) {
      const week = Number(w);
      hours.push({
        id: `hrs_${eid}_${week}`,
        enrollmentId: eid,
        week,
        hours: h,
        submittedAt: at(fallWeekDay(week, 4), "16:00"),
        approvedBy: week <= lastApproved ? preceptor.id : null,
        approvedAt: week <= lastApproved ? at(fallWeekDay(week + 1, 0), "10:00") : null,
      });
    }

    const comps = unit.classification.competencies;
    const grid = f.ratingsWeeks1to5 as unknown as Record<string, number[]>;
    const weeksRated = grid[comps[0]].length;
    for (let w = 1; w <= weeksRated; w++) {
      const levels = comps.map((c) => grid[c][w - 1]);
      const note = isAmara ? data.amara.notes[w - 1] : GENERATED_NOTE;
      addRating(eid, w, code, levels, { id: preceptor.id, name: f.preceptor }, note, at(fallWeekDay(w, 4), "15:00"));
    }

    if (isAmara) {
      const profile = profiles[profiles.length - 1];
      profile.classYear = data.amara.classYear as "junior";
      profile.courses = data.amara.courses;
      profile.availability = data.amara.availability;
      profile.firstGen = data.amara.demographics.firstGen;
      profile.pell = data.amara.demographics.pell;
      profile.adultLearner = data.amara.demographics.adultLearner;
      profile.veteran = data.amara.demographics.veteran;

      comps.forEach((label, i) => {
        evidence.push({
          id: `evd_${eid}_${i + 1}`,
          enrollmentId: eid,
          competencyId: competencyId(code, i + 1),
          sentence: (data.amara.evidence as Record<string, string>)[label],
          authorId: preceptor.id,
          aiAssisted: false,
        });
      });

      for (const ws of data.amara.workSamples) {
        const sid = `ws_${eid}_${ws.week}`;
        const pages = ws.meta.startsWith("2 pages") ? 2 : 1;
        const content = await samplePdf(ws.title, pages);
        samples.push({
          id: sid,
          enrollmentId: eid,
          week: ws.week,
          title: ws.title,
          description: ws.meta.split(",")[0],
          blobUrl: null,
          blobPathname: null,
          mimeType: "application/pdf",
          sizeBytes: Buffer.from(content, "base64").length,
          status: "verified",
          verifiedBy: preceptor.id,
          verifiedAt: at(fallWeekDay(ws.week + 1, 1), "11:00"),
        });
        sampleFiles.push({ sampleId: sid, contentBase64: content });
      }

      for (const m of data.amara.sponsorMeetings) {
        meetings.push({
          id: `mtg_${eid}_${m.week}`,
          enrollmentId: eid,
          sponsorId: sponsor.id,
          scheduledAt: at(fallWeekDay(m.week, 1), m.time),
          completedAt: m.completed ? at(fallWeekDay(m.week, 1), "15:45") : null,
          summary: m.summary,
        });
      }

      for (const r of data.amara.references) {
        const referee = staffByName.get(r.name)!;
        const askedAt = r.status === "asked" ? at(addDays(today, -r.askedDaysAgo!), "10:00") : at(fallWeekDay(r.confirmedWeek! - 1, 2));
        refs.push({
          id: `ref_${eid}_${slug(r.name).replace(/\./g, "-")}`,
          enrollmentId: eid,
          refereeUserId: referee.id,
          refereeName: r.name,
          refereeTitle: r.title,
          relation: r.relation as "preceptor",
          status: r.status as "confirmed",
          quote: r.quote,
          quoteApproved: r.quoteApproved,
          quoteHiddenByStudent: false,
          askedAt,
          confirmedAt: r.status === "confirmed" ? at(fallWeekDay(r.confirmedWeek!, 2), "10:00") : null,
        });
      }

      notifications.push(
        { id: `ntf_${uid}_rated5`, userId: uid, type: "ratingPosted", payload: { preceptor: "Dana Ortiz", week: 5, href: "/s/transcript" }, readAt: at(fallWeekDay(5, 5)) },
        { id: `ntf_${uid}_hours6`, userId: uid, type: "hoursReminder", payload: { week: 6, href: "/s/hours" }, readAt: at(fallWeekDay(6, 4)) },
      );
      notifications.push({
        id: `ntf_${staffByName.get("Priya Shah")!.id}_ref_amara`,
        userId: staffByName.get("Priya Shah")!.id,
        type: "referenceRequest",
        payload: { firstName: "Amara", href: "/m/references" },
      });
    } else {
      refs.push({
        id: `ref_${eid}_${slug(f.preceptor).replace(/\./g, "-")}`,
        enrollmentId: eid,
        refereeUserId: preceptor.id,
        refereeName: f.preceptor,
        refereeTitle: preceptor.title,
        relation: "preceptor",
        status: "confirmed",
        quote: null,
        quoteApproved: false,
        quoteHiddenByStudent: false,
        askedAt: at(fallWeekDay(3, 2)),
        confirmedAt: at(fallWeekDay(4, 2), "10:00"),
      });
    }

    if (f.preceptor === "Dana Ortiz") {
      notifications.push({
        id: `ntf_${preceptor.id}_due6_${pid}`,
        userId: preceptor.id,
        type: "ratingDue",
        payload: { firstName: f.name.split(" ")[0], week: 6, href: `/m/rate/${eid}/6` },
      });
    }
  }

  // Spring 2026 (completed)
  const springEnd = data.cohorts.spring2026.endDate;
  const poolEnteredAt = at(data.cohorts.spring2026.poolEnteredAt);
  const springOnboarded = at(addDays(springStart, -14));
  const poolByName = new Map<string, string>();
  const directorOther = (unitKey: string) => (unitKey === "info" ? "Marcus Hill" : "Priya Shah");

  for (const sp of data.cohorts.spring2026.students as SpringStudent[]) {
    const unit = unitByKey.get(sp.unit)!;
    const code = unit.classification.code;
    const { uid, pid } = addProfile(sp.name, sp.college, sp.major, sp.majorCategory, sp.firstGenOrPell, springOnboarded);
    const preceptorName = unit.preceptors[0].name;
    const preceptor = staffByName.get(preceptorName)!;
    const sponsor = staffByName.get(unit.sponsor.name)!;
    const eid = enrollmentIdFor(sp.name, "spring");
    const withdrawn = sp.status === "withdrawn";
    const withdrawMatch = sp.withdrawReason?.match(/^(.*) \(week (\d+)\)$/);
    const lastWeek = withdrawn ? Number(withdrawMatch?.[2] ?? 1) - 1 : 15;

    consent(pid, "program_participation", true, springOnboarded);
    consent(pid, "share_city_hr", sp.shareCityHr, springOnboarded);
    consent(pid, "share_vendor_bridge", sp.shareVendorBridge, at(springEnd, "12:00"));
    consent(pid, "public_link", false, springOnboarded);
    consent(pid, "demographic_reporting", true, springOnboarded);

    enrollments.push({
      id: eid,
      studentId: pid,
      cohortId: cohortId("spring", sp.college),
      unitId: unitId(sp.unit),
      classificationId: classificationId(code),
      preceptorId: preceptor.id,
      sponsorId: sponsor.id,
      status: withdrawn ? "withdrawn" : "completed",
      startDate: springStart,
      completedAt: withdrawn ? null : at(springEnd, "17:00"),
      matchedBy: renee,
      withdrawReason: withdrawMatch?.[1] ?? null,
    });

    for (let w = 1; w <= lastWeek; w++) {
      const i = profiles.length;
      hours.push({
        id: `hrs_${eid}_${w}`,
        enrollmentId: eid,
        week: w,
        hours: 10 + ((i + w) % 3),
        submittedAt: at(springWeekDay(w, 4), "16:00"),
        approvedBy: preceptor.id,
        approvedAt: at(springWeekDay(w + 1, 0), "10:00"),
      });
      const levels = [3, 3, 3, sp.skillsAtBar === 4 && w === 15 ? 2 : 3, 3];
      addRating(eid, w, code, levels, { id: preceptor.id, name: preceptorName }, GENERATED_NOTE, at(springWeekDay(w, 4), "15:00"));
    }

    if (!withdrawn) {
      const refList = [
        { name: preceptorName, relation: "preceptor" as const, week: 6 },
        { name: unit.sponsor.name, relation: "sponsor" as const, week: 10 },
        { name: directorOther(sp.unit), relation: "other" as const, week: 14 },
      ];
      for (const r of refList) {
        const referee = staffByName.get(r.name)!;
        refs.push({
          id: `ref_${eid}_${slug(r.name).replace(/\./g, "-")}`,
          enrollmentId: eid,
          refereeUserId: referee.id,
          refereeName: r.name,
          refereeTitle: referee.title,
          relation: r.relation,
          status: "confirmed",
          quote: null,
          quoteApproved: false,
          quoteHiddenByStudent: false,
          askedAt: at(springWeekDay(r.week - 1, 1)),
          confirmedAt: at(springWeekDay(r.week, 1)),
        });
      }
    }

    if (sp.inPool) {
      const peid = `pool_${eid}`;
      poolByName.set(sp.name, peid);
      pool.push({
        id: peid,
        studentId: pid,
        enrollmentId: eid,
        classificationId: classificationId(code),
        enteredAt: poolEnteredAt,
        status: sp.offerResult === "accepted" ? "hired" : "active",
      });
    }

    if (sp.vendorInterview) {
      const vendor = data.vendors.find((v) => v.name === sp.vendorInterview!.vendor)!;
      interest.push({
        id: `vi_${eid}_${slug(vendor.name).replace(/\./g, "-")}`,
        vendorOrgId: vendorOrgId(vendor.name),
        studentId: pid,
        requestedBy: userId(vendor.email),
        requestedAt: at("2026-05-04"),
        studentResponse: "accepted",
        interviewAt: at("2026-05-14", "10:00"),
        outcome: sp.vendorInterview.outcome as "offer",
      });
    }

    if (sp.name === "Luis Herrera") {
      notifications.push({
        id: `ntf_${uid}_invited`,
        userId: uid,
        type: "invited",
        payload: { opening: data.luisInvite.opening, href: "/s/openings" },
      });
    }
  }

  // Openings and invites
  const springByName = new Map((data.cohorts.spring2026.students as SpringStudent[]).map((x) => [x.name, x]));
  for (const o of data.springOpenings) {
    const oid = `opn_${slug(o.title).replace(/\./g, "-")}`;
    const unit = data.units.find((u) => u.name === o.unit)!;
    const isLuis = o.status === "open";
    openings.push({
      id: oid,
      programId: PROGRAM_ID,
      classificationId: classificationId(o.classification),
      title: o.title,
      department: unit.department,
      postedAt: isLuis ? at(addDays(today, -10)) : at("2026-04-28"),
      status: o.status as "open",
    });
    for (const name of o.invitees) {
      const student = springByName.get(name)!;
      const peid = poolByName.get(name)!;
      if (isLuis) {
        invites.push({
          id: `inv_${oid}_${peid}`,
          openingId: oid,
          poolEntryId: peid,
          invitedAt: at(addDays(today, -7), "10:00"),
          interviewAt: at(addDays(today, 3), "10:00"),
        });
        continue;
      }
      const offerDate = addDays(data.cohorts.spring2026.poolEnteredAt, student.offerDays!);
      const offerAt = at(offerDate, "15:00");
      invites.push({
        id: `inv_${oid}_${peid}`,
        openingId: oid,
        poolEntryId: peid,
        invitedAt: at("2026-04-28", "10:00"),
        interviewAt: at(addDays(offerDate, -5), "10:00"),
        offerAt,
        acceptedAt: student.offerResult === "accepted" ? at(addDays(offerDate, 2), "12:00") : null,
        declinedAt: student.offerResult === "declined" ? at(addDays(offerDate, 2), "12:00") : null,
      });
    }
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`TRUNCATE ${PROGRAM_TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`));
    for (const rows of chunk(users)) {
      await tx
        .insert(s.user)
        .values(rows)
        .onConflictDoUpdate({ target: s.user.id, set: { name: sql`excluded.name`, email: sql`excluded.email` } });
    }
    await tx.insert(s.programs).values({
      id: PROGRAM_ID,
      cityOrgId: CITY_ORG_ID,
      name: data.program.programName,
      timeZone: TZ,
      weeks: data.program.weeks,
      minHours: data.program.minHours,
      maxHours: data.program.maxHours,
      payRateCents: data.program.payRateCents,
      offerTargetDays: data.program.offerTargetDays,
      referencesRequired: data.program.referencesRequired,
    });
    const steps: [Parameters<typeof tx.insert>[0], unknown[]][] = [
      [s.organizations, orgs],
      [s.memberships, memberships],
      [s.cohorts, cohorts],
      [s.teachingUnits, units],
      [s.unitMajorMap, unitMajors],
      [s.jobClassifications, classifications],
      [s.competencies, comps],
      [s.studentProfiles, profiles],
      [s.consents, consents],
      [s.enrollments, enrollments],
      [s.hoursEntries, hours],
      [s.weeklyRatings, ratings],
      [s.ratingScores, scores],
      [s.skillEvidence, evidence],
      [s.workSamples, samples],
      [s.sampleFiles, sampleFiles],
      [s.sponsorMeetings, meetings],
      [s.references, refs],
      [s.poolEntries, pool],
      [s.openings, openings],
      [s.openingInvites, invites],
      [s.vendorPledges, vendorPledges],
      [s.vendorInterest, interest],
      [s.notifications, notifications],
    ];
    for (const [table, rows] of steps) {
      for (const part of chunk(rows)) {
        if (part.length) await tx.insert(table).values(part as never);
      }
    }
    await tx
      .insert(s.appState)
      .values({ key: "seeded_at", value: now.toISOString() })
      .onConflictDoUpdate({ target: s.appState.key, set: { value: now.toISOString() } });
  });

  return {
    users: users.length,
    enrollments: enrollments.length,
    ratings: ratings.length,
    fallStart,
  };
}
