CREATE TYPE "public"."ai_feature" AS ENUM('note_draft', 'plain_language', 'course_mapping');--> statement-breakpoint
CREATE TYPE "public"."class_year" AS ENUM('junior', 'senior', 'community_college', 'adult_learner');--> statement-breakpoint
CREATE TYPE "public"."cohort_status" AS ENUM('planned', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('program_participation', 'share_city_hr', 'share_vendor_bridge', 'public_link', 'demographic_reporting');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('proposed', 'active', 'completed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."major_category" AS ENUM('accounting_finance', 'business', 'computer_science_it', 'communications_marketing', 'engineering', 'economics_data_math', 'social_sciences_psychology', 'criminal_justice', 'humanities_arts', 'other');--> statement-breakpoint
CREATE TYPE "public"."opening_status" AS ENUM('draft', 'open', 'filled', 'closed');--> statement-breakpoint
CREATE TYPE "public"."org_type" AS ENUM('city', 'college', 'vendor');--> statement-breakpoint
CREATE TYPE "public"."plain_status" AS ENUM('none', 'draft', 'approved');--> statement-breakpoint
CREATE TYPE "public"."pool_status" AS ENUM('active', 'offered', 'hired', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."reference_relation" AS ENUM('preceptor', 'sponsor', 'other');--> statement-breakpoint
CREATE TYPE "public"."reference_status" AS ENUM('asked', 'confirmed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'preceptor', 'sponsor', 'city_coordinator', 'college_coordinator', 'vendor_recruiter');--> statement-breakpoint
CREATE TYPE "public"."sample_status" AS ENUM('draft', 'verified');--> statement-breakpoint
CREATE TYPE "public"."student_response" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."vendor_outcome" AS ENUM('none', 'offer', 'no_offer');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"feature" "ai_feature" NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"accepted" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"college_org_id" text,
	"term_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "cohort_status" DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" text PRIMARY KEY NOT NULL,
	"classification_id" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competency_position_range" CHECK ("competencies"."position" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"type" "consent_type" NOT NULL,
	"granted" boolean NOT NULL,
	"version" text NOT NULL,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"cohort_id" text NOT NULL,
	"unit_id" text,
	"classification_id" text,
	"preceptor_id" text,
	"sponsor_id" text,
	"status" "enrollment_status" DEFAULT 'proposed' NOT NULL,
	"start_date" date,
	"completed_at" timestamp with time zone,
	"matched_by" text,
	"match_reason" text,
	"withdraw_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hours_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"week" integer NOT NULL,
	"hours" numeric(4, 2) NOT NULL,
	"note" text,
	"submitted_at" timestamp with time zone,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hours_range" CHECK ("hours_entries"."hours" >= 0 and "hours_entries"."hours" <= 12)
);
--> statement-breakpoint
CREATE TABLE "job_classifications" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"unit_id" text,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"raw_description" text NOT NULL,
	"plain_summary" jsonb,
	"plain_status" "plain_status" DEFAULT 'none' NOT NULL,
	"plain_approved_by" text,
	"plain_approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" "role" NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opening_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"opening_id" text NOT NULL,
	"pool_entry_id" text NOT NULL,
	"invited_at" timestamp with time zone NOT NULL,
	"interview_at" timestamp with time zone,
	"offer_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"declined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "openings" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"classification_id" text,
	"title" text NOT NULL,
	"department" text,
	"posted_at" timestamp with time zone,
	"status" "opening_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "org_type" NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"city_program_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "outcome_surveys" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"months_after" integer NOT NULL,
	"employed" boolean,
	"college_level_job" boolean,
	"public_sector" boolean,
	"is_comparison_peer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"classification_id" text,
	"entered_at" timestamp with time zone NOT NULL,
	"status" "pool_status" DEFAULT 'active' NOT NULL,
	"withdraw_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_entries_enrollment_id_unique" UNIQUE("enrollment_id")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY NOT NULL,
	"city_org_id" text NOT NULL,
	"name" text NOT NULL,
	"time_zone" text NOT NULL,
	"weeks" integer DEFAULT 15 NOT NULL,
	"min_hours" integer DEFAULT 10 NOT NULL,
	"max_hours" integer DEFAULT 12 NOT NULL,
	"pay_rate_cents" integer DEFAULT 1700 NOT NULL,
	"offer_target_days" integer DEFAULT 30 NOT NULL,
	"references_required" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rating_scores" (
	"rating_id" text NOT NULL,
	"competency_id" text NOT NULL,
	"level" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_scores_rating_id_competency_id_pk" PRIMARY KEY("rating_id","competency_id"),
	CONSTRAINT "level_range" CHECK ("rating_scores"."level" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "references" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"referee_user_id" text,
	"referee_name" text NOT NULL,
	"referee_title" text,
	"relation" "reference_relation" NOT NULL,
	"status" "reference_status" DEFAULT 'asked' NOT NULL,
	"quote" text,
	"quote_approved" boolean DEFAULT false NOT NULL,
	"quote_hidden_by_student" boolean DEFAULT false NOT NULL,
	"asked_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_length" CHECK ("references"."quote" is null or char_length("references"."quote") <= 240)
);
--> statement-breakpoint
CREATE TABLE "sample_files" (
	"sample_id" text PRIMARY KEY NOT NULL,
	"content_base64" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"competency_id" text NOT NULL,
	"sentence" text NOT NULL,
	"author_id" text,
	"ai_assisted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_length" CHECK (char_length("skill_evidence"."sentence") <= 200)
);
--> statement-breakpoint
CREATE TABLE "sponsor_meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"sponsor_id" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"college_org_id" text,
	"major" text,
	"major_category" "major_category",
	"class_year" "class_year",
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"availability" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"courses" text[] DEFAULT '{}' NOT NULL,
	"first_gen" boolean,
	"pell" boolean,
	"adult_learner" boolean,
	"veteran" boolean,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "teaching_units" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL,
	"name" text NOT NULL,
	"department" text NOT NULL,
	"line_name" text NOT NULL,
	"line_letter" text NOT NULL,
	"line_color" text NOT NULL,
	"capacity" integer NOT NULL,
	"schedule_windows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_major_map" (
	"unit_id" text NOT NULL,
	"major_category" "major_category" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unit_major_map_unit_id_major_category_pk" PRIMARY KEY("unit_id","major_category")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_interest" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_org_id" text NOT NULL,
	"student_id" text NOT NULL,
	"requested_by" text,
	"requested_at" timestamp with time zone NOT NULL,
	"student_response" "student_response" DEFAULT 'pending' NOT NULL,
	"interview_at" timestamp with time zone,
	"outcome" "vendor_outcome" DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_pledges" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_org_id" text NOT NULL,
	"program_id" text NOT NULL,
	"contact_name" text NOT NULL,
	"roles_offered" text NOT NULL,
	"pledged_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"week" integer NOT NULL,
	"preceptor_id" text,
	"note" text,
	"note_ai_assisted" boolean DEFAULT false NOT NULL,
	"signature_name" text,
	"signed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_samples" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"week" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"blob_url" text,
	"blob_pathname" text,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"status" "sample_status" DEFAULT 'draft' NOT NULL,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_events" ADD CONSTRAINT "ai_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_college_org_id_organizations_id_fk" FOREIGN KEY ("college_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_classification_id_job_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."job_classifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_unit_id_teaching_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."teaching_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_classification_id_job_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."job_classifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_preceptor_id_user_id_fk" FOREIGN KEY ("preceptor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_sponsor_id_user_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_matched_by_user_id_fk" FOREIGN KEY ("matched_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_entries" ADD CONSTRAINT "hours_entries_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_entries" ADD CONSTRAINT "hours_entries_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_classifications" ADD CONSTRAINT "job_classifications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_classifications" ADD CONSTRAINT "job_classifications_unit_id_teaching_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."teaching_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_classifications" ADD CONSTRAINT "job_classifications_plain_approved_by_user_id_fk" FOREIGN KEY ("plain_approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opening_invites" ADD CONSTRAINT "opening_invites_opening_id_openings_id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."openings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opening_invites" ADD CONSTRAINT "opening_invites_pool_entry_id_pool_entries_id_fk" FOREIGN KEY ("pool_entry_id") REFERENCES "public"."pool_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "openings" ADD CONSTRAINT "openings_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "openings" ADD CONSTRAINT "openings_classification_id_job_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."job_classifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_city_program_id_programs_id_fk" FOREIGN KEY ("city_program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_surveys" ADD CONSTRAINT "outcome_surveys_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_entries" ADD CONSTRAINT "pool_entries_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_entries" ADD CONSTRAINT "pool_entries_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_entries" ADD CONSTRAINT "pool_entries_classification_id_job_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."job_classifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_scores" ADD CONSTRAINT "rating_scores_rating_id_weekly_ratings_id_fk" FOREIGN KEY ("rating_id") REFERENCES "public"."weekly_ratings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_scores" ADD CONSTRAINT "rating_scores_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_referee_user_id_user_id_fk" FOREIGN KEY ("referee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_files" ADD CONSTRAINT "sample_files_sample_id_work_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."work_samples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_meetings" ADD CONSTRAINT "sponsor_meetings_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_meetings" ADD CONSTRAINT "sponsor_meetings_sponsor_id_user_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_college_org_id_organizations_id_fk" FOREIGN KEY ("college_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_major_map" ADD CONSTRAINT "unit_major_map_unit_id_teaching_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."teaching_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_interest" ADD CONSTRAINT "vendor_interest_vendor_org_id_organizations_id_fk" FOREIGN KEY ("vendor_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_interest" ADD CONSTRAINT "vendor_interest_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_interest" ADD CONSTRAINT "vendor_interest_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_pledges" ADD CONSTRAINT "vendor_pledges_vendor_org_id_organizations_id_fk" FOREIGN KEY ("vendor_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_pledges" ADD CONSTRAINT "vendor_pledges_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_ratings" ADD CONSTRAINT "weekly_ratings_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_ratings" ADD CONSTRAINT "weekly_ratings_preceptor_id_user_id_fk" FOREIGN KEY ("preceptor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_samples" ADD CONSTRAINT "work_samples_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_samples" ADD CONSTRAINT "work_samples_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_events_user_feature_idx" ON "ai_events" USING btree ("user_id","feature","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "cohorts_program_idx" ON "cohorts" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "cohorts_college_idx" ON "cohorts" USING btree ("college_org_id");--> statement-breakpoint
CREATE INDEX "competencies_classification_idx" ON "competencies" USING btree ("classification_id");--> statement-breakpoint
CREATE INDEX "consents_student_idx" ON "consents" USING btree ("student_id","type");--> statement-breakpoint
CREATE INDEX "enrollments_student_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "enrollments_cohort_idx" ON "enrollments" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "enrollments_unit_idx" ON "enrollments" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "enrollments_classification_idx" ON "enrollments" USING btree ("classification_id");--> statement-breakpoint
CREATE INDEX "enrollments_preceptor_idx" ON "enrollments" USING btree ("preceptor_id");--> statement-breakpoint
CREATE INDEX "enrollments_sponsor_idx" ON "enrollments" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "enrollments_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "hours_enrollment_week" ON "hours_entries" USING btree ("enrollment_id","week");--> statement-breakpoint
CREATE INDEX "classifications_program_idx" ON "job_classifications" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "classifications_unit_idx" ON "job_classifications" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_org_role" ON "memberships" USING btree ("user_id","organization_id","role");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_org_idx" ON "memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invites_opening_entry" ON "opening_invites" USING btree ("opening_id","pool_entry_id");--> statement-breakpoint
CREATE INDEX "invites_entry_idx" ON "opening_invites" USING btree ("pool_entry_id");--> statement-breakpoint
CREATE INDEX "openings_program_idx" ON "openings" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "openings_classification_idx" ON "openings" USING btree ("classification_id");--> statement-breakpoint
CREATE INDEX "organizations_program_idx" ON "organizations" USING btree ("city_program_id");--> statement-breakpoint
CREATE INDEX "surveys_student_idx" ON "outcome_surveys" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "pool_student_idx" ON "pool_entries" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "pool_classification_idx" ON "pool_entries" USING btree ("classification_id");--> statement-breakpoint
CREATE INDEX "scores_competency_idx" ON "rating_scores" USING btree ("competency_id");--> statement-breakpoint
CREATE INDEX "references_enrollment_idx" ON "references" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "references_referee_idx" ON "references" USING btree ("referee_user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "share_links_token_idx" ON "share_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "share_links_student_idx" ON "share_links" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_enrollment_competency" ON "skill_evidence" USING btree ("enrollment_id","competency_id");--> statement-breakpoint
CREATE INDEX "evidence_competency_idx" ON "skill_evidence" USING btree ("competency_id");--> statement-breakpoint
CREATE INDEX "meetings_enrollment_idx" ON "sponsor_meetings" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "meetings_sponsor_idx" ON "sponsor_meetings" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "profiles_college_idx" ON "student_profiles" USING btree ("college_org_id");--> statement-breakpoint
CREATE INDEX "units_program_idx" ON "teaching_units" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "interest_vendor_idx" ON "vendor_interest" USING btree ("vendor_org_id");--> statement-breakpoint
CREATE INDEX "interest_student_idx" ON "vendor_interest" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "pledges_vendor_idx" ON "vendor_pledges" USING btree ("vendor_org_id");--> statement-breakpoint
CREATE INDEX "pledges_program_idx" ON "vendor_pledges" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_enrollment_week" ON "weekly_ratings" USING btree ("enrollment_id","week");--> statement-breakpoint
CREATE INDEX "ratings_preceptor_idx" ON "weekly_ratings" USING btree ("preceptor_id");--> statement-breakpoint
CREATE INDEX "samples_enrollment_idx" ON "work_samples" USING btree ("enrollment_id");