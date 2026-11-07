import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

const tstz = (name: string) => timestamp(name, { withTimezone: true });

export type ScheduleWindow = { day: number; start: string; end: string };
export type PlainSummary = { summary: string; dayToDay: string[]; whatYouNeed: string[] };

// Better Auth tables

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  locale: text("locale").notNull().default("en"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: tstz("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: tstz("access_token_expires_at"),
    refreshTokenExpiresAt: tstz("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: tstz("expires_at").notNull(),
  ...timestamps,
});

// Enums

export const orgType = pgEnum("org_type", ["city", "college", "vendor"]);
export const roleEnum = pgEnum("role", [
  "student",
  "preceptor",
  "sponsor",
  "city_coordinator",
  "college_coordinator",
  "vendor_recruiter",
]);
export const cohortStatus = pgEnum("cohort_status", ["planned", "active", "completed"]);
export const majorCategory = pgEnum("major_category", [
  "accounting_finance",
  "business",
  "computer_science_it",
  "communications_marketing",
  "engineering",
  "economics_data_math",
  "social_sciences_psychology",
  "criminal_justice",
  "humanities_arts",
  "other",
]);
export const plainStatus = pgEnum("plain_status", ["none", "draft", "approved"]);
export const classYear = pgEnum("class_year", [
  "junior",
  "senior",
  "community_college",
  "adult_learner",
]);
export const consentType = pgEnum("consent_type", [
  "program_participation",
  "share_city_hr",
  "share_vendor_bridge",
  "public_link",
  "demographic_reporting",
]);
export const enrollmentStatus = pgEnum("enrollment_status", [
  "proposed",
  "active",
  "completed",
  "withdrawn",
]);
export const sampleStatus = pgEnum("sample_status", ["draft", "verified"]);
export const referenceRelation = pgEnum("reference_relation", ["preceptor", "sponsor", "other"]);
export const referenceStatus = pgEnum("reference_status", ["asked", "confirmed", "declined"]);
export const poolStatus = pgEnum("pool_status", ["active", "offered", "hired", "withdrawn"]);
export const openingStatus = pgEnum("opening_status", ["draft", "open", "filled", "closed"]);
export const studentResponse = pgEnum("student_response", ["pending", "accepted", "declined"]);
export const vendorOutcome = pgEnum("vendor_outcome", ["none", "offer", "no_offer"]);
export const aiFeature = pgEnum("ai_feature", ["note_draft", "plain_language", "course_mapping"]);

export type Role = (typeof roleEnum.enumValues)[number];
export type MajorCategory = (typeof majorCategory.enumValues)[number];
export type ConsentType = (typeof consentType.enumValues)[number];
export type EnrollmentStatus = (typeof enrollmentStatus.enumValues)[number];
export type AiFeature = (typeof aiFeature.enumValues)[number];

// Program tables

export const programs = pgTable("programs", {
  id: id(),
  cityOrgId: text("city_org_id").notNull(),
  name: text("name").notNull(),
  timeZone: text("time_zone").notNull(),
  weeks: integer("weeks").notNull().default(15),
  minHours: integer("min_hours").notNull().default(10),
  maxHours: integer("max_hours").notNull().default(12),
  payRateCents: integer("pay_rate_cents").notNull().default(1700),
  offerTargetDays: integer("offer_target_days").notNull().default(30),
  referencesRequired: integer("references_required").notNull().default(3),
  ...timestamps,
});

export const organizations = pgTable(
  "organizations",
  {
    id: id(),
    type: orgType("type").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    cityProgramId: text("city_program_id").references(() => programs.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("organizations_program_idx").on(t.cityProgramId)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    title: text("title"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("memberships_user_org_role").on(t.userId, t.organizationId, t.role),
    index("memberships_user_idx").on(t.userId),
    index("memberships_org_idx").on(t.organizationId),
  ],
);

export const cohorts = pgTable(
  "cohorts",
  {
    id: id(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    collegeOrgId: text("college_org_id").references(() => organizations.id, { onDelete: "set null" }),
    termName: text("term_name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: cohortStatus("status").notNull().default("planned"),
    ...timestamps,
  },
  (t) => [index("cohorts_program_idx").on(t.programId), index("cohorts_college_idx").on(t.collegeOrgId)],
);

export const teachingUnits = pgTable(
  "teaching_units",
  {
    id: id(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    department: text("department").notNull(),
    lineName: text("line_name").notNull(),
    lineLetter: text("line_letter").notNull(),
    lineColor: text("line_color").notNull(),
    capacity: integer("capacity").notNull(),
    scheduleWindows: jsonb("schedule_windows").$type<ScheduleWindow[]>().notNull().default([]),
    ...timestamps,
  },
  (t) => [index("units_program_idx").on(t.programId)],
);

export const unitMajorMap = pgTable(
  "unit_major_map",
  {
    unitId: text("unit_id")
      .notNull()
      .references(() => teachingUnits.id, { onDelete: "cascade" }),
    majorCategory: majorCategory("major_category").notNull(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.unitId, t.majorCategory] })],
);

export const jobClassifications = pgTable(
  "job_classifications",
  {
    id: id(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    unitId: text("unit_id").references(() => teachingUnits.id, { onDelete: "set null" }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    rawDescription: text("raw_description").notNull(),
    plainSummary: jsonb("plain_summary").$type<PlainSummary>(),
    plainStatus: plainStatus("plain_status").notNull().default("none"),
    plainApprovedBy: text("plain_approved_by").references(() => user.id, { onDelete: "set null" }),
    plainApprovedAt: tstz("plain_approved_at"),
    ...timestamps,
  },
  (t) => [index("classifications_program_idx").on(t.programId), index("classifications_unit_idx").on(t.unitId)],
);

export const competencies = pgTable(
  "competencies",
  {
    id: id(),
    classificationId: text("classification_id")
      .notNull()
      .references(() => jobClassifications.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    label: text("label").notNull(),
    ...timestamps,
  },
  (t) => [
    index("competencies_classification_idx").on(t.classificationId),
    check("competency_position_range", sql`${t.position} between 1 and 5`),
  ],
);

export const studentProfiles = pgTable(
  "student_profiles",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    collegeOrgId: text("college_org_id").references(() => organizations.id, { onDelete: "set null" }),
    major: text("major"),
    majorCategory: majorCategory("major_category"),
    classYear: classYear("class_year"),
    preferredLanguage: text("preferred_language").notNull().default("en"),
    availability: jsonb("availability").$type<ScheduleWindow[]>().notNull().default([]),
    courses: text("courses").array().notNull().default([]),
    firstGen: boolean("first_gen"),
    pell: boolean("pell"),
    adultLearner: boolean("adult_learner"),
    veteran: boolean("veteran"),
    onboardedAt: tstz("onboarded_at"),
    /** "Roles your courses connect to" (Section 8.3), kept once the student finishes onboarding. */
    courseMapping: jsonb("course_mapping").$type<{ classificationCode: string; reason: string; courses: string[] }[]>(),
    ...timestamps,
  },
  (t) => [index("profiles_college_idx").on(t.collegeOrgId)],
);

export const consents = pgTable(
  "consents",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    type: consentType("type").notNull(),
    granted: boolean("granted").notNull(),
    version: text("version").notNull(),
    grantedAt: tstz("granted_at"),
    revokedAt: tstz("revoked_at"),
    ...timestamps,
  },
  (t) => [index("consents_student_idx").on(t.studentId, t.type)],
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    unitId: text("unit_id").references(() => teachingUnits.id, { onDelete: "set null" }),
    classificationId: text("classification_id").references(() => jobClassifications.id, {
      onDelete: "set null",
    }),
    preceptorId: text("preceptor_id").references(() => user.id, { onDelete: "set null" }),
    sponsorId: text("sponsor_id").references(() => user.id, { onDelete: "set null" }),
    status: enrollmentStatus("status").notNull().default("proposed"),
    startDate: date("start_date"),
    completedAt: tstz("completed_at"),
    matchedBy: text("matched_by").references(() => user.id, { onDelete: "set null" }),
    matchReason: text("match_reason"),
    withdrawReason: text("withdraw_reason"),
    ...timestamps,
  },
  (t) => [
    index("enrollments_student_idx").on(t.studentId),
    index("enrollments_cohort_idx").on(t.cohortId),
    index("enrollments_unit_idx").on(t.unitId),
    index("enrollments_classification_idx").on(t.classificationId),
    index("enrollments_preceptor_idx").on(t.preceptorId),
    index("enrollments_sponsor_idx").on(t.sponsorId),
    index("enrollments_status_idx").on(t.status),
  ],
);

export const hoursEntries = pgTable(
  "hours_entries",
  {
    id: id(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    hours: numeric("hours", { precision: 4, scale: 2, mode: "number" }).notNull(),
    note: text("note"),
    submittedAt: tstz("submitted_at"),
    approvedBy: text("approved_by").references(() => user.id, { onDelete: "set null" }),
    approvedAt: tstz("approved_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("hours_enrollment_week").on(t.enrollmentId, t.week),
    check("hours_range", sql`${t.hours} >= 0 and ${t.hours} <= 12`),
  ],
);

export const weeklyRatings = pgTable(
  "weekly_ratings",
  {
    id: id(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    preceptorId: text("preceptor_id").references(() => user.id, { onDelete: "set null" }),
    note: text("note"),
    noteAiAssisted: boolean("note_ai_assisted").notNull().default(false),
    signatureName: text("signature_name"),
    signedAt: tstz("signed_at"),
    submittedAt: tstz("submitted_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("ratings_enrollment_week").on(t.enrollmentId, t.week),
    index("ratings_preceptor_idx").on(t.preceptorId),
  ],
);

export const ratingScores = pgTable(
  "rating_scores",
  {
    ratingId: text("rating_id")
      .notNull()
      .references(() => weeklyRatings.id, { onDelete: "cascade" }),
    competencyId: text("competency_id")
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
    level: smallint("level").notNull(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.ratingId, t.competencyId] }),
    index("scores_competency_idx").on(t.competencyId),
    check("level_range", sql`${t.level} between 1 and 4`),
  ],
);

export const skillEvidence = pgTable(
  "skill_evidence",
  {
    id: id(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    competencyId: text("competency_id")
      .notNull()
      .references(() => competencies.id, { onDelete: "cascade" }),
    sentence: text("sentence").notNull(),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    aiAssisted: boolean("ai_assisted").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("evidence_enrollment_competency").on(t.enrollmentId, t.competencyId),
    index("evidence_competency_idx").on(t.competencyId),
    check("evidence_length", sql`char_length(${t.sentence}) <= 200`),
  ],
);

export const workSamples = pgTable(
  "work_samples",
  {
    id: id(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    blobUrl: text("blob_url"),
    blobPathname: text("blob_pathname"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    status: sampleStatus("status").notNull().default("draft"),
    verifiedBy: text("verified_by").references(() => user.id, { onDelete: "set null" }),
    verifiedAt: tstz("verified_at"),
    ...timestamps,
  },
  (t) => [index("samples_enrollment_idx").on(t.enrollmentId)],
);

/** Seeded sample files live in the database so the demo works without Blob storage. */
export const sampleFiles = pgTable("sample_files", {
  sampleId: text("sample_id")
    .primaryKey()
    .references(() => workSamples.id, { onDelete: "cascade" }),
  contentBase64: text("content_base64").notNull(),
  ...timestamps,
});

export const sponsorMeetings = pgTable(
  "sponsor_meetings",
  {
    id: id(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    sponsorId: text("sponsor_id").references(() => user.id, { onDelete: "set null" }),
    scheduledAt: tstz("scheduled_at").notNull(),
    completedAt: tstz("completed_at"),
    summary: text("summary"),
    ...timestamps,
  },
  (t) => [index("meetings_enrollment_idx").on(t.enrollmentId), index("meetings_sponsor_idx").on(t.sponsorId)],
);

export const references = pgTable(
  "references",
  {
    id: id(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    refereeUserId: text("referee_user_id").references(() => user.id, { onDelete: "set null" }),
    refereeName: text("referee_name").notNull(),
    refereeTitle: text("referee_title"),
    relation: referenceRelation("relation").notNull(),
    status: referenceStatus("status").notNull().default("asked"),
    quote: text("quote"),
    quoteApproved: boolean("quote_approved").notNull().default(false),
    quoteHiddenByStudent: boolean("quote_hidden_by_student").notNull().default(false),
    askedAt: tstz("asked_at"),
    confirmedAt: tstz("confirmed_at"),
    ...timestamps,
  },
  (t) => [
    index("references_enrollment_idx").on(t.enrollmentId),
    index("references_referee_idx").on(t.refereeUserId),
    check("quote_length", sql`${t.quote} is null or char_length(${t.quote}) <= 240`),
  ],
);

export const shareLinks = pgTable(
  "share_links",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: tstz("expires_at").notNull(),
    revokedAt: tstz("revoked_at"),
    ...timestamps,
  },
  (t) => [index("share_links_token_idx").on(t.tokenHash), index("share_links_student_idx").on(t.studentId)],
);

export const poolEntries = pgTable(
  "pool_entries",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    enrollmentId: text("enrollment_id")
      .notNull()
      .unique()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    classificationId: text("classification_id").references(() => jobClassifications.id, {
      onDelete: "set null",
    }),
    enteredAt: tstz("entered_at").notNull(),
    status: poolStatus("status").notNull().default("active"),
    withdrawReason: text("withdraw_reason"),
    ...timestamps,
  },
  (t) => [index("pool_student_idx").on(t.studentId), index("pool_classification_idx").on(t.classificationId)],
);

export const openings = pgTable(
  "openings",
  {
    id: id(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    classificationId: text("classification_id").references(() => jobClassifications.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    department: text("department"),
    postedAt: tstz("posted_at"),
    status: openingStatus("status").notNull().default("draft"),
    ...timestamps,
  },
  (t) => [index("openings_program_idx").on(t.programId), index("openings_classification_idx").on(t.classificationId)],
);

export const openingInvites = pgTable(
  "opening_invites",
  {
    id: id(),
    openingId: text("opening_id")
      .notNull()
      .references(() => openings.id, { onDelete: "cascade" }),
    poolEntryId: text("pool_entry_id")
      .notNull()
      .references(() => poolEntries.id, { onDelete: "cascade" }),
    invitedAt: tstz("invited_at").notNull(),
    interviewAt: tstz("interview_at"),
    offerAt: tstz("offer_at"),
    acceptedAt: tstz("accepted_at"),
    declinedAt: tstz("declined_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("invites_opening_entry").on(t.openingId, t.poolEntryId),
    index("invites_entry_idx").on(t.poolEntryId),
  ],
);

export const vendorPledges = pgTable(
  "vendor_pledges",
  {
    id: id(),
    vendorOrgId: text("vendor_org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    contactName: text("contact_name").notNull(),
    rolesOffered: text("roles_offered").notNull(),
    pledgedAt: tstz("pledged_at").notNull(),
    endedAt: tstz("ended_at"),
    ...timestamps,
  },
  (t) => [index("pledges_vendor_idx").on(t.vendorOrgId), index("pledges_program_idx").on(t.programId)],
);

export const vendorInterest = pgTable(
  "vendor_interest",
  {
    id: id(),
    vendorOrgId: text("vendor_org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    requestedBy: text("requested_by").references(() => user.id, { onDelete: "set null" }),
    requestedAt: tstz("requested_at").notNull(),
    studentResponse: studentResponse("student_response").notNull().default("pending"),
    interviewAt: tstz("interview_at"),
    outcome: vendorOutcome("outcome").notNull().default("none"),
    ...timestamps,
  },
  (t) => [index("interest_vendor_idx").on(t.vendorOrgId), index("interest_student_idx").on(t.studentId)],
);

export const outcomeSurveys = pgTable(
  "outcome_surveys",
  {
    id: id(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentProfiles.id, { onDelete: "cascade" }),
    monthsAfter: integer("months_after").notNull(),
    employed: boolean("employed"),
    collegeLevelJob: boolean("college_level_job"),
    publicSector: boolean("public_sector"),
    isComparisonPeer: boolean("is_comparison_peer").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("surveys_student_idx").on(t.studentId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, string | number>>().notNull().default({}),
    readAt: tstz("read_at"),
    ...timestamps,
  },
  (t) => [index("notifications_user_read_idx").on(t.userId, t.readAt)],
);

export const aiEvents = pgTable(
  "ai_events",
  {
    id: id(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    feature: aiFeature("feature").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    accepted: boolean("accepted"),
    ...timestamps,
  },
  (t) => [index("ai_events_user_feature_idx").on(t.userId, t.feature, t.createdAt)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    at: tstz("at").notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [index("audit_actor_idx").on(t.actorId), index("audit_entity_idx").on(t.entity, t.entityId)],
);

/** Demo-wide state such as the last reset time (rate limit for "Reset demo data"). */
export const appState = pgTable("app_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  ...timestamps,
});
