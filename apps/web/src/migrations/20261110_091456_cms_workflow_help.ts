import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_activities_review_state" AS ENUM('draft', 'in_review', 'changes_requested', 'approved');
  CREATE TYPE "public"."enum_ai_activities_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ai_activities_v_version_competency" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum__ai_activities_v_version_tier" AS ENUM('fast', 'standard');
  CREATE TYPE "public"."enum__ai_activities_v_version_review_state" AS ENUM('draft', 'in_review', 'changes_requested', 'approved');
  CREATE TYPE "public"."enum__ai_activities_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ai_activities_v_published_locale" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum_project_briefs_review_state" AS ENUM('draft', 'in_review', 'changes_requested', 'approved');
  CREATE TYPE "public"."enum_project_briefs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__project_briefs_v_version_level" AS ENUM('smp', 'sma_smk');
  CREATE TYPE "public"."enum__project_briefs_v_version_competency" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum__project_briefs_v_version_smk_major" AS ENUM('akuntansi', 'pemasaran', 'tjkt', 'pplg', 'perhotelan', 'kuliner', 'otomotif', 'dkv', 'kesehatan');
  CREATE TYPE "public"."enum__project_briefs_v_version_review_state" AS ENUM('draft', 'in_review', 'changes_requested', 'approved');
  CREATE TYPE "public"."enum__project_briefs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__project_briefs_v_published_locale" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum_pages_review_state" AS ENUM('draft', 'in_review', 'changes_requested', 'approved');
  CREATE TYPE "public"."enum__pages_v_version_review_state" AS ENUM('draft', 'in_review', 'changes_requested', 'approved');
  CREATE TYPE "public"."enum_badges_review_state" AS ENUM('draft', 'in_review', 'changes_requested', 'approved');
  CREATE TYPE "public"."enum_help_articles_category" AS ENUM('getting_started', 'students', 'teachers', 'parents', 'schools', 'tests', 'privacy');
  CREATE TYPE "public"."enum_support_tickets_category" AS ENUM('account', 'learning', 'test', 'school', 'privacy', 'other');
  CREATE TYPE "public"."enum_support_tickets_status" AS ENUM('open', 'waiting', 'resolved');
  ALTER TYPE "public"."enum_users_roles" ADD VALUE 'content_reviewer' BEFORE 'assessment_author';
  ALTER TYPE "public"."enum_lessons_review_state" ADD VALUE 'changes_requested' BEFORE 'approved';
  ALTER TYPE "public"."enum__lessons_v_version_review_state" ADD VALUE 'changes_requested' BEFORE 'approved';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'content_review';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'content_decision';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'ticket_new';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'ticket_reply';
  CREATE TABLE "lessons_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_lessons_v_version_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "ai_activities_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_ai_activities_v_version_starter_prompts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ai_activities_v_version_reflection" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ai_activities_v_version_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ai_activities_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_competency" "enum__ai_activities_v_version_competency",
  	"version_instructions" varchar,
  	"version_tier" "enum__ai_activities_v_version_tier" DEFAULT 'standard',
  	"version_message_limit" numeric DEFAULT 12,
  	"version_review_state" "enum__ai_activities_v_version_review_state" DEFAULT 'draft',
  	"version_submitted_by_id" integer,
  	"version_approved_by_id" integer,
  	"version_approved_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__ai_activities_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__ai_activities_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_ai_activities_v_locales" (
  	"version_title" varchar,
  	"version_goal" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "project_briefs_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_project_briefs_v_version_rubric" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_project_briefs_v_version_rubric_locales" (
  	"criterion" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_project_briefs_v_version_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_project_briefs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_level" "enum__project_briefs_v_version_level",
  	"version_competency" "enum__project_briefs_v_version_competency",
  	"version_smk_major" "enum__project_briefs_v_version_smk_major",
  	"version_allow_teams" boolean DEFAULT true,
  	"version_review_state" "enum__project_briefs_v_version_review_state" DEFAULT 'draft',
  	"version_submitted_by_id" integer,
  	"version_approved_by_id" integer,
  	"version_approved_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__project_briefs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__project_briefs_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_project_briefs_v_locales" (
  	"version_title" varchar,
  	"version_client" varchar,
  	"version_problem" varchar,
  	"version_deliverables" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_pages_v_version_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "badges_review_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"action" varchar NOT NULL,
  	"by_id" integer,
  	"note" varchar,
  	"at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "help_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" "enum_help_articles_category" NOT NULL,
  	"order" numeric DEFAULT 10,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "help_articles_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"body" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "support_tickets_messages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" varchar NOT NULL,
  	"by_id" integer,
  	"from_staff" boolean,
  	"internal" boolean,
  	"at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "support_tickets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" varchar NOT NULL,
  	"category" "enum_support_tickets_category" NOT NULL,
  	"status" "enum_support_tickets_status" DEFAULT 'open' NOT NULL,
  	"requester_id" integer,
  	"guest_email" varchar,
  	"guest_name" varchar,
  	"last_activity_at" timestamp(3) with time zone,
  	"resolved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "ai_activities_starter_prompts" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "ai_activities_reflection" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "competency" DROP NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "instructions" DROP NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "tier" DROP NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "message_limit" DROP NOT NULL;
  ALTER TABLE "ai_activities_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "ai_activities_locales" ALTER COLUMN "goal" DROP NOT NULL;
  ALTER TABLE "project_briefs_rubric_locales" ALTER COLUMN "criterion" DROP NOT NULL;
  ALTER TABLE "project_briefs" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "project_briefs" ALTER COLUMN "level" DROP NOT NULL;
  ALTER TABLE "project_briefs" ALTER COLUMN "competency" DROP NOT NULL;
  ALTER TABLE "project_briefs_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "project_briefs_locales" ALTER COLUMN "problem" DROP NOT NULL;
  ALTER TABLE "project_briefs_locales" ALTER COLUMN "deliverables" DROP NOT NULL;
  ALTER TABLE "lessons" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "lessons" ADD COLUMN "approved_by_id" integer;
  ALTER TABLE "lessons" ADD COLUMN "approved_at" timestamp(3) with time zone;
  ALTER TABLE "_lessons_v" ADD COLUMN "version_submitted_by_id" integer;
  ALTER TABLE "_lessons_v" ADD COLUMN "version_approved_by_id" integer;
  ALTER TABLE "_lessons_v" ADD COLUMN "version_approved_at" timestamp(3) with time zone;
  ALTER TABLE "ai_activities" ADD COLUMN "review_state" "enum_ai_activities_review_state" DEFAULT 'draft';
  ALTER TABLE "ai_activities" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "ai_activities" ADD COLUMN "approved_by_id" integer;
  ALTER TABLE "ai_activities" ADD COLUMN "approved_at" timestamp(3) with time zone;
  ALTER TABLE "ai_activities" ADD COLUMN "_status" "enum_ai_activities_status" DEFAULT 'draft';
  ALTER TABLE "project_briefs" ADD COLUMN "review_state" "enum_project_briefs_review_state" DEFAULT 'draft';
  ALTER TABLE "project_briefs" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "project_briefs" ADD COLUMN "approved_by_id" integer;
  ALTER TABLE "project_briefs" ADD COLUMN "approved_at" timestamp(3) with time zone;
  ALTER TABLE "project_briefs" ADD COLUMN "_status" "enum_project_briefs_status" DEFAULT 'draft';
  ALTER TABLE "pages" ADD COLUMN "review_state" "enum_pages_review_state" DEFAULT 'draft';
  ALTER TABLE "pages" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "pages" ADD COLUMN "approved_by_id" integer;
  ALTER TABLE "pages" ADD COLUMN "approved_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_review_state" "enum__pages_v_version_review_state" DEFAULT 'draft';
  ALTER TABLE "_pages_v" ADD COLUMN "version_submitted_by_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_approved_by_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_approved_at" timestamp(3) with time zone;
  ALTER TABLE "badges" ADD COLUMN "review_state" "enum_badges_review_state" DEFAULT 'draft';
  ALTER TABLE "badges" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "badges" ADD COLUMN "approved_by_id" integer;
  ALTER TABLE "badges" ADD COLUMN "approved_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "help_articles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "support_tickets_id" integer;
  ALTER TABLE "lessons_review_history" ADD CONSTRAINT "lessons_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_review_history" ADD CONSTRAINT "lessons_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_review_history" ADD CONSTRAINT "_lessons_v_version_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_review_history" ADD CONSTRAINT "_lessons_v_version_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_activities_review_history" ADD CONSTRAINT "ai_activities_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_activities_review_history" ADD CONSTRAINT "ai_activities_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ai_activities_v_version_starter_prompts" ADD CONSTRAINT "_ai_activities_v_version_starter_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ai_activities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ai_activities_v_version_reflection" ADD CONSTRAINT "_ai_activities_v_version_reflection_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ai_activities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ai_activities_v_version_review_history" ADD CONSTRAINT "_ai_activities_v_version_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ai_activities_v_version_review_history" ADD CONSTRAINT "_ai_activities_v_version_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ai_activities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ai_activities_v" ADD CONSTRAINT "_ai_activities_v_parent_id_ai_activities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ai_activities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ai_activities_v" ADD CONSTRAINT "_ai_activities_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ai_activities_v" ADD CONSTRAINT "_ai_activities_v_version_approved_by_id_users_id_fk" FOREIGN KEY ("version_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ai_activities_v_locales" ADD CONSTRAINT "_ai_activities_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ai_activities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "project_briefs_review_history" ADD CONSTRAINT "project_briefs_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "project_briefs_review_history" ADD CONSTRAINT "project_briefs_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."project_briefs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_project_briefs_v_version_rubric" ADD CONSTRAINT "_project_briefs_v_version_rubric_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_project_briefs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_project_briefs_v_version_rubric_locales" ADD CONSTRAINT "_project_briefs_v_version_rubric_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_project_briefs_v_version_rubric"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_project_briefs_v_version_review_history" ADD CONSTRAINT "_project_briefs_v_version_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_project_briefs_v_version_review_history" ADD CONSTRAINT "_project_briefs_v_version_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_project_briefs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_project_briefs_v" ADD CONSTRAINT "_project_briefs_v_parent_id_project_briefs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."project_briefs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_project_briefs_v" ADD CONSTRAINT "_project_briefs_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_project_briefs_v" ADD CONSTRAINT "_project_briefs_v_version_approved_by_id_users_id_fk" FOREIGN KEY ("version_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_project_briefs_v_locales" ADD CONSTRAINT "_project_briefs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_project_briefs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_review_history" ADD CONSTRAINT "pages_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_review_history" ADD CONSTRAINT "pages_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_review_history" ADD CONSTRAINT "_pages_v_version_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_version_review_history" ADD CONSTRAINT "_pages_v_version_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "badges_review_history" ADD CONSTRAINT "badges_review_history_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "badges_review_history" ADD CONSTRAINT "badges_review_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "help_articles_locales" ADD CONSTRAINT "help_articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."help_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "support_tickets_messages" ADD CONSTRAINT "support_tickets_messages_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "support_tickets_messages" ADD CONSTRAINT "support_tickets_messages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "lessons_review_history_order_idx" ON "lessons_review_history" USING btree ("_order");
  CREATE INDEX "lessons_review_history_parent_id_idx" ON "lessons_review_history" USING btree ("_parent_id");
  CREATE INDEX "lessons_review_history_by_idx" ON "lessons_review_history" USING btree ("by_id");
  CREATE INDEX "_lessons_v_version_review_history_order_idx" ON "_lessons_v_version_review_history" USING btree ("_order");
  CREATE INDEX "_lessons_v_version_review_history_parent_id_idx" ON "_lessons_v_version_review_history" USING btree ("_parent_id");
  CREATE INDEX "_lessons_v_version_review_history_by_idx" ON "_lessons_v_version_review_history" USING btree ("by_id");
  CREATE INDEX "ai_activities_review_history_order_idx" ON "ai_activities_review_history" USING btree ("_order");
  CREATE INDEX "ai_activities_review_history_parent_id_idx" ON "ai_activities_review_history" USING btree ("_parent_id");
  CREATE INDEX "ai_activities_review_history_by_idx" ON "ai_activities_review_history" USING btree ("by_id");
  CREATE INDEX "_ai_activities_v_version_starter_prompts_order_idx" ON "_ai_activities_v_version_starter_prompts" USING btree ("_order");
  CREATE INDEX "_ai_activities_v_version_starter_prompts_parent_id_idx" ON "_ai_activities_v_version_starter_prompts" USING btree ("_parent_id");
  CREATE INDEX "_ai_activities_v_version_starter_prompts_locale_idx" ON "_ai_activities_v_version_starter_prompts" USING btree ("_locale");
  CREATE INDEX "_ai_activities_v_version_reflection_order_idx" ON "_ai_activities_v_version_reflection" USING btree ("_order");
  CREATE INDEX "_ai_activities_v_version_reflection_parent_id_idx" ON "_ai_activities_v_version_reflection" USING btree ("_parent_id");
  CREATE INDEX "_ai_activities_v_version_reflection_locale_idx" ON "_ai_activities_v_version_reflection" USING btree ("_locale");
  CREATE INDEX "_ai_activities_v_version_review_history_order_idx" ON "_ai_activities_v_version_review_history" USING btree ("_order");
  CREATE INDEX "_ai_activities_v_version_review_history_parent_id_idx" ON "_ai_activities_v_version_review_history" USING btree ("_parent_id");
  CREATE INDEX "_ai_activities_v_version_review_history_by_idx" ON "_ai_activities_v_version_review_history" USING btree ("by_id");
  CREATE INDEX "_ai_activities_v_parent_idx" ON "_ai_activities_v" USING btree ("parent_id");
  CREATE INDEX "_ai_activities_v_version_version_slug_idx" ON "_ai_activities_v" USING btree ("version_slug");
  CREATE INDEX "_ai_activities_v_version_version_review_state_idx" ON "_ai_activities_v" USING btree ("version_review_state");
  CREATE INDEX "_ai_activities_v_version_version_submitted_by_idx" ON "_ai_activities_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_ai_activities_v_version_version_approved_by_idx" ON "_ai_activities_v" USING btree ("version_approved_by_id");
  CREATE INDEX "_ai_activities_v_version_version_updated_at_idx" ON "_ai_activities_v" USING btree ("version_updated_at");
  CREATE INDEX "_ai_activities_v_version_version_created_at_idx" ON "_ai_activities_v" USING btree ("version_created_at");
  CREATE INDEX "_ai_activities_v_version_version__status_idx" ON "_ai_activities_v" USING btree ("version__status");
  CREATE INDEX "_ai_activities_v_created_at_idx" ON "_ai_activities_v" USING btree ("created_at");
  CREATE INDEX "_ai_activities_v_updated_at_idx" ON "_ai_activities_v" USING btree ("updated_at");
  CREATE INDEX "_ai_activities_v_snapshot_idx" ON "_ai_activities_v" USING btree ("snapshot");
  CREATE INDEX "_ai_activities_v_published_locale_idx" ON "_ai_activities_v" USING btree ("published_locale");
  CREATE INDEX "_ai_activities_v_latest_idx" ON "_ai_activities_v" USING btree ("latest");
  CREATE INDEX "_ai_activities_v_autosave_idx" ON "_ai_activities_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_ai_activities_v_locales_locale_parent_id_unique" ON "_ai_activities_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "project_briefs_review_history_order_idx" ON "project_briefs_review_history" USING btree ("_order");
  CREATE INDEX "project_briefs_review_history_parent_id_idx" ON "project_briefs_review_history" USING btree ("_parent_id");
  CREATE INDEX "project_briefs_review_history_by_idx" ON "project_briefs_review_history" USING btree ("by_id");
  CREATE INDEX "_project_briefs_v_version_rubric_order_idx" ON "_project_briefs_v_version_rubric" USING btree ("_order");
  CREATE INDEX "_project_briefs_v_version_rubric_parent_id_idx" ON "_project_briefs_v_version_rubric" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_project_briefs_v_version_rubric_locales_locale_parent_id_un" ON "_project_briefs_v_version_rubric_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_project_briefs_v_version_review_history_order_idx" ON "_project_briefs_v_version_review_history" USING btree ("_order");
  CREATE INDEX "_project_briefs_v_version_review_history_parent_id_idx" ON "_project_briefs_v_version_review_history" USING btree ("_parent_id");
  CREATE INDEX "_project_briefs_v_version_review_history_by_idx" ON "_project_briefs_v_version_review_history" USING btree ("by_id");
  CREATE INDEX "_project_briefs_v_parent_idx" ON "_project_briefs_v" USING btree ("parent_id");
  CREATE INDEX "_project_briefs_v_version_version_slug_idx" ON "_project_briefs_v" USING btree ("version_slug");
  CREATE INDEX "_project_briefs_v_version_version_review_state_idx" ON "_project_briefs_v" USING btree ("version_review_state");
  CREATE INDEX "_project_briefs_v_version_version_submitted_by_idx" ON "_project_briefs_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_project_briefs_v_version_version_approved_by_idx" ON "_project_briefs_v" USING btree ("version_approved_by_id");
  CREATE INDEX "_project_briefs_v_version_version_updated_at_idx" ON "_project_briefs_v" USING btree ("version_updated_at");
  CREATE INDEX "_project_briefs_v_version_version_created_at_idx" ON "_project_briefs_v" USING btree ("version_created_at");
  CREATE INDEX "_project_briefs_v_version_version__status_idx" ON "_project_briefs_v" USING btree ("version__status");
  CREATE INDEX "_project_briefs_v_created_at_idx" ON "_project_briefs_v" USING btree ("created_at");
  CREATE INDEX "_project_briefs_v_updated_at_idx" ON "_project_briefs_v" USING btree ("updated_at");
  CREATE INDEX "_project_briefs_v_snapshot_idx" ON "_project_briefs_v" USING btree ("snapshot");
  CREATE INDEX "_project_briefs_v_published_locale_idx" ON "_project_briefs_v" USING btree ("published_locale");
  CREATE INDEX "_project_briefs_v_latest_idx" ON "_project_briefs_v" USING btree ("latest");
  CREATE INDEX "_project_briefs_v_autosave_idx" ON "_project_briefs_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_project_briefs_v_locales_locale_parent_id_unique" ON "_project_briefs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_review_history_order_idx" ON "pages_review_history" USING btree ("_order");
  CREATE INDEX "pages_review_history_parent_id_idx" ON "pages_review_history" USING btree ("_parent_id");
  CREATE INDEX "pages_review_history_by_idx" ON "pages_review_history" USING btree ("by_id");
  CREATE INDEX "_pages_v_version_review_history_order_idx" ON "_pages_v_version_review_history" USING btree ("_order");
  CREATE INDEX "_pages_v_version_review_history_parent_id_idx" ON "_pages_v_version_review_history" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_review_history_by_idx" ON "_pages_v_version_review_history" USING btree ("by_id");
  CREATE INDEX "badges_review_history_order_idx" ON "badges_review_history" USING btree ("_order");
  CREATE INDEX "badges_review_history_parent_id_idx" ON "badges_review_history" USING btree ("_parent_id");
  CREATE INDEX "badges_review_history_by_idx" ON "badges_review_history" USING btree ("by_id");
  CREATE UNIQUE INDEX "help_articles_slug_idx" ON "help_articles" USING btree ("slug");
  CREATE INDEX "help_articles_updated_at_idx" ON "help_articles" USING btree ("updated_at");
  CREATE INDEX "help_articles_created_at_idx" ON "help_articles" USING btree ("created_at");
  CREATE UNIQUE INDEX "help_articles_locales_locale_parent_id_unique" ON "help_articles_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "support_tickets_messages_order_idx" ON "support_tickets_messages" USING btree ("_order");
  CREATE INDEX "support_tickets_messages_parent_id_idx" ON "support_tickets_messages" USING btree ("_parent_id");
  CREATE INDEX "support_tickets_messages_by_idx" ON "support_tickets_messages" USING btree ("by_id");
  CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");
  CREATE INDEX "support_tickets_requester_idx" ON "support_tickets" USING btree ("requester_id");
  CREATE INDEX "support_tickets_guest_email_idx" ON "support_tickets" USING btree ("guest_email");
  CREATE INDEX "support_tickets_last_activity_at_idx" ON "support_tickets" USING btree ("last_activity_at");
  CREATE INDEX "support_tickets_updated_at_idx" ON "support_tickets" USING btree ("updated_at");
  CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets" USING btree ("created_at");
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_approved_by_id_users_id_fk" FOREIGN KEY ("version_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_activities" ADD CONSTRAINT "ai_activities_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_activities" ADD CONSTRAINT "ai_activities_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "project_briefs" ADD CONSTRAINT "project_briefs_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "project_briefs" ADD CONSTRAINT "project_briefs_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_approved_by_id_users_id_fk" FOREIGN KEY ("version_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "badges" ADD CONSTRAINT "badges_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "badges" ADD CONSTRAINT "badges_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_help_articles_fk" FOREIGN KEY ("help_articles_id") REFERENCES "public"."help_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_support_tickets_fk" FOREIGN KEY ("support_tickets_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_review_state_idx" ON "lessons" USING btree ("review_state");
  CREATE INDEX "lessons_submitted_by_idx" ON "lessons" USING btree ("submitted_by_id");
  CREATE INDEX "lessons_approved_by_idx" ON "lessons" USING btree ("approved_by_id");
  CREATE INDEX "_lessons_v_version_version_review_state_idx" ON "_lessons_v" USING btree ("version_review_state");
  CREATE INDEX "_lessons_v_version_version_submitted_by_idx" ON "_lessons_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_lessons_v_version_version_approved_by_idx" ON "_lessons_v" USING btree ("version_approved_by_id");
  CREATE INDEX "ai_activities_review_state_idx" ON "ai_activities" USING btree ("review_state");
  CREATE INDEX "ai_activities_submitted_by_idx" ON "ai_activities" USING btree ("submitted_by_id");
  CREATE INDEX "ai_activities_approved_by_idx" ON "ai_activities" USING btree ("approved_by_id");
  CREATE INDEX "ai_activities__status_idx" ON "ai_activities" USING btree ("_status");
  CREATE INDEX "project_briefs_review_state_idx" ON "project_briefs" USING btree ("review_state");
  CREATE INDEX "project_briefs_submitted_by_idx" ON "project_briefs" USING btree ("submitted_by_id");
  CREATE INDEX "project_briefs_approved_by_idx" ON "project_briefs" USING btree ("approved_by_id");
  CREATE INDEX "project_briefs__status_idx" ON "project_briefs" USING btree ("_status");
  CREATE INDEX "pages_review_state_idx" ON "pages" USING btree ("review_state");
  CREATE INDEX "pages_submitted_by_idx" ON "pages" USING btree ("submitted_by_id");
  CREATE INDEX "pages_approved_by_idx" ON "pages" USING btree ("approved_by_id");
  CREATE INDEX "_pages_v_version_version_review_state_idx" ON "_pages_v" USING btree ("version_review_state");
  CREATE INDEX "_pages_v_version_version_submitted_by_idx" ON "_pages_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_pages_v_version_version_approved_by_idx" ON "_pages_v" USING btree ("version_approved_by_id");
  CREATE INDEX "badges_review_state_idx" ON "badges" USING btree ("review_state");
  CREATE INDEX "badges_submitted_by_idx" ON "badges" USING btree ("submitted_by_id");
  CREATE INDEX "badges_approved_by_idx" ON "badges" USING btree ("approved_by_id");
  CREATE INDEX "payload_locked_documents_rels_help_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("help_articles_id");
  CREATE INDEX "payload_locked_documents_rels_support_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("support_tickets_id");`)
  // Content that was already live stays live and counts as approved (it existed before the workflow).
  await db.execute(sql`
  UPDATE "ai_activities" SET "_status" = 'published', "review_state" = 'approved';
  UPDATE "project_briefs" SET "_status" = 'published', "review_state" = 'approved';
  UPDATE "badges" SET "review_state" = 'approved';
  UPDATE "pages" SET "review_state" = 'approved' WHERE "_status" = 'published';
  UPDATE "lessons" SET "review_state" = 'approved' WHERE "_status" = 'published' AND "review_state" IS DISTINCT FROM 'approved';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lessons_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lessons_v_version_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_activities_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ai_activities_v_version_starter_prompts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ai_activities_v_version_reflection" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ai_activities_v_version_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ai_activities_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_ai_activities_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_briefs_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_project_briefs_v_version_rubric" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_project_briefs_v_version_rubric_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_project_briefs_v_version_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_project_briefs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_project_briefs_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_version_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "badges_review_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "help_articles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "help_articles_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "support_tickets_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "support_tickets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "lessons_review_history" CASCADE;
  DROP TABLE "_lessons_v_version_review_history" CASCADE;
  DROP TABLE "ai_activities_review_history" CASCADE;
  DROP TABLE "_ai_activities_v_version_starter_prompts" CASCADE;
  DROP TABLE "_ai_activities_v_version_reflection" CASCADE;
  DROP TABLE "_ai_activities_v_version_review_history" CASCADE;
  DROP TABLE "_ai_activities_v" CASCADE;
  DROP TABLE "_ai_activities_v_locales" CASCADE;
  DROP TABLE "project_briefs_review_history" CASCADE;
  DROP TABLE "_project_briefs_v_version_rubric" CASCADE;
  DROP TABLE "_project_briefs_v_version_rubric_locales" CASCADE;
  DROP TABLE "_project_briefs_v_version_review_history" CASCADE;
  DROP TABLE "_project_briefs_v" CASCADE;
  DROP TABLE "_project_briefs_v_locales" CASCADE;
  DROP TABLE "pages_review_history" CASCADE;
  DROP TABLE "_pages_v_version_review_history" CASCADE;
  DROP TABLE "badges_review_history" CASCADE;
  DROP TABLE "help_articles" CASCADE;
  DROP TABLE "help_articles_locales" CASCADE;
  DROP TABLE "support_tickets_messages" CASCADE;
  DROP TABLE "support_tickets" CASCADE;
  ALTER TABLE "lessons" DROP CONSTRAINT "lessons_submitted_by_id_users_id_fk";
  
  ALTER TABLE "lessons" DROP CONSTRAINT "lessons_approved_by_id_users_id_fk";
  
  ALTER TABLE "_lessons_v" DROP CONSTRAINT "_lessons_v_version_submitted_by_id_users_id_fk";
  
  ALTER TABLE "_lessons_v" DROP CONSTRAINT "_lessons_v_version_approved_by_id_users_id_fk";
  
  ALTER TABLE "ai_activities" DROP CONSTRAINT "ai_activities_submitted_by_id_users_id_fk";
  
  ALTER TABLE "ai_activities" DROP CONSTRAINT "ai_activities_approved_by_id_users_id_fk";
  
  ALTER TABLE "project_briefs" DROP CONSTRAINT "project_briefs_submitted_by_id_users_id_fk";
  
  ALTER TABLE "project_briefs" DROP CONSTRAINT "project_briefs_approved_by_id_users_id_fk";
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_submitted_by_id_users_id_fk";
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_approved_by_id_users_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_submitted_by_id_users_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_approved_by_id_users_id_fk";
  
  ALTER TABLE "badges" DROP CONSTRAINT "badges_submitted_by_id_users_id_fk";
  
  ALTER TABLE "badges" DROP CONSTRAINT "badges_approved_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_help_articles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_support_tickets_fk";
  
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('student', 'parent', 'teacher', 'school_admin', 'candidate', 'content_editor', 'assessment_author', 'rater', 'proctor', 'super_admin');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  ALTER TABLE "lessons" ALTER COLUMN "review_state" SET DATA TYPE text;
  ALTER TABLE "lessons" ALTER COLUMN "review_state" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_lessons_review_state";
  CREATE TYPE "public"."enum_lessons_review_state" AS ENUM('draft', 'in_review', 'approved');
  ALTER TABLE "lessons" ALTER COLUMN "review_state" SET DEFAULT 'draft'::"public"."enum_lessons_review_state";
  ALTER TABLE "lessons" ALTER COLUMN "review_state" SET DATA TYPE "public"."enum_lessons_review_state" USING "review_state"::"public"."enum_lessons_review_state";
  ALTER TABLE "_lessons_v" ALTER COLUMN "version_review_state" SET DATA TYPE text;
  ALTER TABLE "_lessons_v" ALTER COLUMN "version_review_state" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum__lessons_v_version_review_state";
  CREATE TYPE "public"."enum__lessons_v_version_review_state" AS ENUM('draft', 'in_review', 'approved');
  ALTER TABLE "_lessons_v" ALTER COLUMN "version_review_state" SET DEFAULT 'draft'::"public"."enum__lessons_v_version_review_state";
  ALTER TABLE "_lessons_v" ALTER COLUMN "version_review_state" SET DATA TYPE "public"."enum__lessons_v_version_review_state" USING "version_review_state"::"public"."enum__lessons_v_version_review_state";
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_notifications_kind";
  CREATE TYPE "public"."enum_notifications_kind" AS ENUM('assignment_new', 'submission_received', 'project_graded', 'score_ready', 'consent_granted', 'consent_declined', 'report_received', 'pilot_request', 'badge_earned', 'announcement', 'test_reminder', 'weekly_summary', 'child_linked', 'licence_expiring', 'data_request', 'consent_withdrawn');
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_notifications_kind" USING "kind"::"public"."enum_notifications_kind";
  DROP INDEX "lessons_review_state_idx";
  DROP INDEX "lessons_submitted_by_idx";
  DROP INDEX "lessons_approved_by_idx";
  DROP INDEX "_lessons_v_version_version_review_state_idx";
  DROP INDEX "_lessons_v_version_version_submitted_by_idx";
  DROP INDEX "_lessons_v_version_version_approved_by_idx";
  DROP INDEX "ai_activities_review_state_idx";
  DROP INDEX "ai_activities_submitted_by_idx";
  DROP INDEX "ai_activities_approved_by_idx";
  DROP INDEX "ai_activities__status_idx";
  DROP INDEX "project_briefs_review_state_idx";
  DROP INDEX "project_briefs_submitted_by_idx";
  DROP INDEX "project_briefs_approved_by_idx";
  DROP INDEX "project_briefs__status_idx";
  DROP INDEX "pages_review_state_idx";
  DROP INDEX "pages_submitted_by_idx";
  DROP INDEX "pages_approved_by_idx";
  DROP INDEX "_pages_v_version_version_review_state_idx";
  DROP INDEX "_pages_v_version_version_submitted_by_idx";
  DROP INDEX "_pages_v_version_version_approved_by_idx";
  DROP INDEX "badges_review_state_idx";
  DROP INDEX "badges_submitted_by_idx";
  DROP INDEX "badges_approved_by_idx";
  DROP INDEX "payload_locked_documents_rels_help_articles_id_idx";
  DROP INDEX "payload_locked_documents_rels_support_tickets_id_idx";
  ALTER TABLE "ai_activities_starter_prompts" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "ai_activities_reflection" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "competency" SET NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "instructions" SET NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "tier" SET NOT NULL;
  ALTER TABLE "ai_activities" ALTER COLUMN "message_limit" SET NOT NULL;
  ALTER TABLE "ai_activities_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "ai_activities_locales" ALTER COLUMN "goal" SET NOT NULL;
  ALTER TABLE "project_briefs_rubric_locales" ALTER COLUMN "criterion" SET NOT NULL;
  ALTER TABLE "project_briefs" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "project_briefs" ALTER COLUMN "level" SET NOT NULL;
  ALTER TABLE "project_briefs" ALTER COLUMN "competency" SET NOT NULL;
  ALTER TABLE "project_briefs_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "project_briefs_locales" ALTER COLUMN "problem" SET NOT NULL;
  ALTER TABLE "project_briefs_locales" ALTER COLUMN "deliverables" SET NOT NULL;
  ALTER TABLE "lessons" DROP COLUMN "submitted_by_id";
  ALTER TABLE "lessons" DROP COLUMN "approved_by_id";
  ALTER TABLE "lessons" DROP COLUMN "approved_at";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_submitted_by_id";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_approved_by_id";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_approved_at";
  ALTER TABLE "ai_activities" DROP COLUMN "review_state";
  ALTER TABLE "ai_activities" DROP COLUMN "submitted_by_id";
  ALTER TABLE "ai_activities" DROP COLUMN "approved_by_id";
  ALTER TABLE "ai_activities" DROP COLUMN "approved_at";
  ALTER TABLE "ai_activities" DROP COLUMN "_status";
  ALTER TABLE "project_briefs" DROP COLUMN "review_state";
  ALTER TABLE "project_briefs" DROP COLUMN "submitted_by_id";
  ALTER TABLE "project_briefs" DROP COLUMN "approved_by_id";
  ALTER TABLE "project_briefs" DROP COLUMN "approved_at";
  ALTER TABLE "project_briefs" DROP COLUMN "_status";
  ALTER TABLE "pages" DROP COLUMN "review_state";
  ALTER TABLE "pages" DROP COLUMN "submitted_by_id";
  ALTER TABLE "pages" DROP COLUMN "approved_by_id";
  ALTER TABLE "pages" DROP COLUMN "approved_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_review_state";
  ALTER TABLE "_pages_v" DROP COLUMN "version_submitted_by_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_approved_by_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_approved_at";
  ALTER TABLE "badges" DROP COLUMN "review_state";
  ALTER TABLE "badges" DROP COLUMN "submitted_by_id";
  ALTER TABLE "badges" DROP COLUMN "approved_by_id";
  ALTER TABLE "badges" DROP COLUMN "approved_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "help_articles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "support_tickets_id";
  DROP TYPE "public"."enum_ai_activities_review_state";
  DROP TYPE "public"."enum_ai_activities_status";
  DROP TYPE "public"."enum__ai_activities_v_version_competency";
  DROP TYPE "public"."enum__ai_activities_v_version_tier";
  DROP TYPE "public"."enum__ai_activities_v_version_review_state";
  DROP TYPE "public"."enum__ai_activities_v_version_status";
  DROP TYPE "public"."enum__ai_activities_v_published_locale";
  DROP TYPE "public"."enum_project_briefs_review_state";
  DROP TYPE "public"."enum_project_briefs_status";
  DROP TYPE "public"."enum__project_briefs_v_version_level";
  DROP TYPE "public"."enum__project_briefs_v_version_competency";
  DROP TYPE "public"."enum__project_briefs_v_version_smk_major";
  DROP TYPE "public"."enum__project_briefs_v_version_review_state";
  DROP TYPE "public"."enum__project_briefs_v_version_status";
  DROP TYPE "public"."enum__project_briefs_v_published_locale";
  DROP TYPE "public"."enum_pages_review_state";
  DROP TYPE "public"."enum__pages_v_version_review_state";
  DROP TYPE "public"."enum_badges_review_state";
  DROP TYPE "public"."enum_help_articles_category";
  DROP TYPE "public"."enum_support_tickets_category";
  DROP TYPE "public"."enum_support_tickets_status";`)
}
