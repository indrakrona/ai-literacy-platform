import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_announcements_audience" AS ENUM('student', 'teacher', 'parent', 'school_admin', 'candidate');
  CREATE TYPE "public"."enum_announcements_scope" AS ENUM('platform', 'school');
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'announcement';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'test_reminder';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'weekly_summary';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'child_linked';
  CREATE TABLE "announcements_audience" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_announcements_audience",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"scope" "enum_announcements_scope" DEFAULT 'school' NOT NULL,
  	"school_id" integer,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone,
  	"notify" boolean DEFAULT false,
  	"notified_at" timestamp(3) with time zone,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "announcements_locales" (
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "parent_link_code" varchar;
  ALTER TABLE "users" ADD COLUMN "parent_link_expires_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "last_weekly_summary_at" timestamp(3) with time zone;
  ALTER TABLE "bookings" ADD COLUMN "reminded_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "announcements_id" integer;
  ALTER TABLE "announcements_audience" ADD CONSTRAINT "announcements_audience_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "announcements_locales" ADD CONSTRAINT "announcements_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "announcements_audience_order_idx" ON "announcements_audience" USING btree ("order");
  CREATE INDEX "announcements_audience_parent_idx" ON "announcements_audience" USING btree ("parent_id");
  CREATE INDEX "announcements_school_idx" ON "announcements" USING btree ("school_id");
  CREATE INDEX "announcements_created_by_idx" ON "announcements" USING btree ("created_by_id");
  CREATE INDEX "announcements_updated_at_idx" ON "announcements" USING btree ("updated_at");
  CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");
  CREATE UNIQUE INDEX "announcements_locales_locale_parent_id_unique" ON "announcements_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_parent_link_code_idx" ON "users" USING btree ("parent_link_code");
  CREATE INDEX "payload_locked_documents_rels_announcements_id_idx" ON "payload_locked_documents_rels" USING btree ("announcements_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "announcements_audience" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "announcements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "announcements_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "announcements_audience" CASCADE;
  DROP TABLE "announcements" CASCADE;
  DROP TABLE "announcements_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_announcements_fk";
  
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_notifications_kind";
  CREATE TYPE "public"."enum_notifications_kind" AS ENUM('assignment_new', 'submission_received', 'project_graded', 'score_ready', 'consent_granted', 'consent_declined', 'report_received', 'pilot_request', 'badge_earned');
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_notifications_kind" USING "kind"::"public"."enum_notifications_kind";
  DROP INDEX "users_parent_link_code_idx";
  DROP INDEX "payload_locked_documents_rels_announcements_id_idx";
  ALTER TABLE "users" DROP COLUMN "parent_link_code";
  ALTER TABLE "users" DROP COLUMN "parent_link_expires_at";
  ALTER TABLE "users" DROP COLUMN "last_weekly_summary_at";
  ALTER TABLE "bookings" DROP COLUMN "reminded_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "announcements_id";
  DROP TYPE "public"."enum_announcements_audience";
  DROP TYPE "public"."enum_announcements_scope";`)
}
