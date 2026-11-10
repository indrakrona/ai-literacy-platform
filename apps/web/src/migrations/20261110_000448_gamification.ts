import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_xp_events_source" AS ENUM('lesson_complete', 'quiz_perfect', 'ai_lab_session', 'project_submitted', 'project_graded', 'challenge_complete');
  CREATE TYPE "public"."enum_xp_events_big_idea" AS ENUM('discover', 'understand', 'create', 'protect', 'thrive');
  CREATE TYPE "public"."enum_badges_criterion" AS ENUM('lessons_total', 'lessons_in_big_idea', 'level_in_big_idea', 'all_big_ideas_level', 'projects_graded', 'ai_lab_sessions', 'challenges_completed');
  CREATE TYPE "public"."enum_badges_big_idea" AS ENUM('discover', 'understand', 'create', 'protect', 'thrive');
  CREATE TYPE "public"."enum_challenges_big_idea" AS ENUM('discover', 'understand', 'create', 'protect', 'thrive');
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'badge_earned';
  CREATE TABLE "xp_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"source" "enum_xp_events_source" NOT NULL,
  	"source_id" varchar NOT NULL,
  	"big_idea" "enum_xp_events_big_idea" NOT NULL,
  	"xp" numeric NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "badges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"icon" varchar NOT NULL,
  	"criterion" "enum_badges_criterion" NOT NULL,
  	"target" numeric DEFAULT 1 NOT NULL,
  	"big_idea" "enum_badges_big_idea",
  	"order" numeric DEFAULT 10,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "badges_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "user_badges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"badge_id" integer NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "challenges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"class_id" integer NOT NULL,
  	"big_idea" "enum_challenges_big_idea",
  	"target" numeric DEFAULT 3 NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone NOT NULL,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "challenges_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "gamification_level_thresholds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"xp" numeric NOT NULL
  );
  
  CREATE TABLE "gamification_level_thresholds_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "gamification" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lesson_complete" numeric DEFAULT 10,
  	"quiz_perfect" numeric DEFAULT 5,
  	"ai_lab_session" numeric DEFAULT 5,
  	"project_submitted" numeric DEFAULT 15,
  	"project_graded_per_point" numeric DEFAULT 2,
  	"challenge_complete" numeric DEFAULT 20,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "xp_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "badges_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "user_badges_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "challenges_id" integer;
  ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "badges_locales" ADD CONSTRAINT "badges_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "challenges" ADD CONSTRAINT "challenges_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "challenges" ADD CONSTRAINT "challenges_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "challenges_rels" ADD CONSTRAINT "challenges_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "challenges_rels" ADD CONSTRAINT "challenges_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gamification_level_thresholds" ADD CONSTRAINT "gamification_level_thresholds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gamification"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gamification_level_thresholds_locales" ADD CONSTRAINT "gamification_level_thresholds_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gamification_level_thresholds"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "xp_events_user_idx" ON "xp_events" USING btree ("user_id");
  CREATE INDEX "xp_events_source_idx" ON "xp_events" USING btree ("source");
  CREATE INDEX "xp_events_big_idea_idx" ON "xp_events" USING btree ("big_idea");
  CREATE UNIQUE INDEX "xp_events_key_idx" ON "xp_events" USING btree ("key");
  CREATE INDEX "xp_events_updated_at_idx" ON "xp_events" USING btree ("updated_at");
  CREATE INDEX "xp_events_created_at_idx" ON "xp_events" USING btree ("created_at");
  CREATE UNIQUE INDEX "badges_slug_idx" ON "badges" USING btree ("slug");
  CREATE INDEX "badges_updated_at_idx" ON "badges" USING btree ("updated_at");
  CREATE INDEX "badges_created_at_idx" ON "badges" USING btree ("created_at");
  CREATE UNIQUE INDEX "badges_locales_locale_parent_id_unique" ON "badges_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "user_badges_user_idx" ON "user_badges" USING btree ("user_id");
  CREATE INDEX "user_badges_badge_idx" ON "user_badges" USING btree ("badge_id");
  CREATE UNIQUE INDEX "user_badges_key_idx" ON "user_badges" USING btree ("key");
  CREATE INDEX "user_badges_updated_at_idx" ON "user_badges" USING btree ("updated_at");
  CREATE INDEX "user_badges_created_at_idx" ON "user_badges" USING btree ("created_at");
  CREATE INDEX "challenges_class_idx" ON "challenges" USING btree ("class_id");
  CREATE INDEX "challenges_created_by_idx" ON "challenges" USING btree ("created_by_id");
  CREATE INDEX "challenges_updated_at_idx" ON "challenges" USING btree ("updated_at");
  CREATE INDEX "challenges_created_at_idx" ON "challenges" USING btree ("created_at");
  CREATE INDEX "challenges_rels_order_idx" ON "challenges_rels" USING btree ("order");
  CREATE INDEX "challenges_rels_parent_idx" ON "challenges_rels" USING btree ("parent_id");
  CREATE INDEX "challenges_rels_path_idx" ON "challenges_rels" USING btree ("path");
  CREATE INDEX "challenges_rels_users_id_idx" ON "challenges_rels" USING btree ("users_id");
  CREATE INDEX "gamification_level_thresholds_order_idx" ON "gamification_level_thresholds" USING btree ("_order");
  CREATE INDEX "gamification_level_thresholds_parent_id_idx" ON "gamification_level_thresholds" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "gamification_level_thresholds_locales_locale_parent_id_uniqu" ON "gamification_level_thresholds_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_xp_events_fk" FOREIGN KEY ("xp_events_id") REFERENCES "public"."xp_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_badges_fk" FOREIGN KEY ("badges_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_badges_fk" FOREIGN KEY ("user_badges_id") REFERENCES "public"."user_badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_challenges_fk" FOREIGN KEY ("challenges_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_xp_events_id_idx" ON "payload_locked_documents_rels" USING btree ("xp_events_id");
  CREATE INDEX "payload_locked_documents_rels_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("badges_id");
  CREATE INDEX "payload_locked_documents_rels_user_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("user_badges_id");
  CREATE INDEX "payload_locked_documents_rels_challenges_id_idx" ON "payload_locked_documents_rels" USING btree ("challenges_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "xp_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "badges_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "user_badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "challenges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "challenges_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gamification_level_thresholds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gamification_level_thresholds_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gamification" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "xp_events" CASCADE;
  DROP TABLE "badges" CASCADE;
  DROP TABLE "badges_locales" CASCADE;
  DROP TABLE "user_badges" CASCADE;
  DROP TABLE "challenges" CASCADE;
  DROP TABLE "challenges_rels" CASCADE;
  DROP TABLE "gamification_level_thresholds" CASCADE;
  DROP TABLE "gamification_level_thresholds_locales" CASCADE;
  DROP TABLE "gamification" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_xp_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_badges_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_user_badges_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_challenges_fk";
  
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_notifications_kind";
  CREATE TYPE "public"."enum_notifications_kind" AS ENUM('assignment_new', 'submission_received', 'project_graded', 'score_ready', 'consent_granted', 'consent_declined', 'report_received', 'pilot_request');
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_notifications_kind" USING "kind"::"public"."enum_notifications_kind";
  DROP INDEX "payload_locked_documents_rels_xp_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_badges_id_idx";
  DROP INDEX "payload_locked_documents_rels_user_badges_id_idx";
  DROP INDEX "payload_locked_documents_rels_challenges_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "xp_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "badges_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "user_badges_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "challenges_id";
  DROP TYPE "public"."enum_xp_events_source";
  DROP TYPE "public"."enum_xp_events_big_idea";
  DROP TYPE "public"."enum_badges_criterion";
  DROP TYPE "public"."enum_badges_big_idea";
  DROP TYPE "public"."enum_challenges_big_idea";`)
}
