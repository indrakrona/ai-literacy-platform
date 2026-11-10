import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_classes_grade" AS ENUM('7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_kka_outcomes_competencies" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum_kka_outcomes_phase" AS ENUM('D', 'E', 'F');
  CREATE TYPE "public"."enum_kka_outcomes_element" AS ENUM('bk', 'ld', 'leka', 'ppka', 'ap', 'ad');
  CREATE TYPE "public"."enum_kka_outcomes_status" AS ENUM('draft', 'checked');
  CREATE TYPE "public"."enum_data_requests_type" AS ENUM('access', 'deletion');
  CREATE TYPE "public"."enum_data_requests_status" AS ENUM('open', 'done', 'rejected', 'cancelled');
  ALTER TYPE "public"."enum_consent_requests_status" ADD VALUE 'withdrawn';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'licence_expiring';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'data_request';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'consent_withdrawn';
  CREATE TABLE "kka_outcomes_competencies" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_kka_outcomes_competencies",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "kka_outcomes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"phase" "enum_kka_outcomes_phase" NOT NULL,
  	"element" "enum_kka_outcomes_element" NOT NULL,
  	"status" "enum_kka_outcomes_status" DEFAULT 'draft' NOT NULL,
  	"checked_by" varchar,
  	"checked_at" timestamp(3) with time zone,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "kka_outcomes_locales" (
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "data_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"requested_by_id" integer,
  	"type" "enum_data_requests_type" NOT NULL,
  	"status" "enum_data_requests_status" DEFAULT 'open' NOT NULL,
  	"reason" varchar,
  	"due_at" timestamp(3) with time zone NOT NULL,
  	"resolved_at" timestamp(3) with time zone,
  	"resolved_by_id" integer,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "schools" ADD COLUMN "licence_reminders" varchar;
  ALTER TABLE "classes" ADD COLUMN "grade" "enum_classes_grade";
  ALTER TABLE "consent_requests" ADD COLUMN "withdrawn_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "kka_outcomes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "data_requests_id" integer;
  ALTER TABLE "platform_settings" ADD COLUMN "data_request_days" numeric DEFAULT 3;
  ALTER TABLE "kka_outcomes_competencies" ADD CONSTRAINT "kka_outcomes_competencies_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."kka_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kka_outcomes_locales" ADD CONSTRAINT "kka_outcomes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."kka_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "kka_outcomes_competencies_order_idx" ON "kka_outcomes_competencies" USING btree ("order");
  CREATE INDEX "kka_outcomes_competencies_parent_idx" ON "kka_outcomes_competencies" USING btree ("parent_id");
  CREATE UNIQUE INDEX "kka_outcomes_code_idx" ON "kka_outcomes" USING btree ("code");
  CREATE INDEX "kka_outcomes_updated_at_idx" ON "kka_outcomes" USING btree ("updated_at");
  CREATE INDEX "kka_outcomes_created_at_idx" ON "kka_outcomes" USING btree ("created_at");
  CREATE UNIQUE INDEX "kka_outcomes_locales_locale_parent_id_unique" ON "kka_outcomes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "data_requests_user_idx" ON "data_requests" USING btree ("user_id");
  CREATE INDEX "data_requests_requested_by_idx" ON "data_requests" USING btree ("requested_by_id");
  CREATE INDEX "data_requests_status_idx" ON "data_requests" USING btree ("status");
  CREATE INDEX "data_requests_due_at_idx" ON "data_requests" USING btree ("due_at");
  CREATE INDEX "data_requests_resolved_by_idx" ON "data_requests" USING btree ("resolved_by_id");
  CREATE INDEX "data_requests_updated_at_idx" ON "data_requests" USING btree ("updated_at");
  CREATE INDEX "data_requests_created_at_idx" ON "data_requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kka_outcomes_fk" FOREIGN KEY ("kka_outcomes_id") REFERENCES "public"."kka_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_data_requests_fk" FOREIGN KEY ("data_requests_id") REFERENCES "public"."data_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_kka_outcomes_id_idx" ON "payload_locked_documents_rels" USING btree ("kka_outcomes_id");
  CREATE INDEX "payload_locked_documents_rels_data_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("data_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "kka_outcomes_competencies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "kka_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "kka_outcomes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "data_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "kka_outcomes_competencies" CASCADE;
  DROP TABLE "kka_outcomes" CASCADE;
  DROP TABLE "kka_outcomes_locales" CASCADE;
  DROP TABLE "data_requests" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_kka_outcomes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_data_requests_fk";
  
  ALTER TABLE "consent_requests" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "consent_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_consent_requests_status";
  CREATE TYPE "public"."enum_consent_requests_status" AS ENUM('pending', 'granted', 'declined', 'expired');
  ALTER TABLE "consent_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_consent_requests_status";
  ALTER TABLE "consent_requests" ALTER COLUMN "status" SET DATA TYPE "public"."enum_consent_requests_status" USING "status"::"public"."enum_consent_requests_status";
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_notifications_kind";
  CREATE TYPE "public"."enum_notifications_kind" AS ENUM('assignment_new', 'submission_received', 'project_graded', 'score_ready', 'consent_granted', 'consent_declined', 'report_received', 'pilot_request', 'badge_earned', 'announcement', 'test_reminder', 'weekly_summary', 'child_linked');
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_notifications_kind" USING "kind"::"public"."enum_notifications_kind";
  DROP INDEX "payload_locked_documents_rels_kka_outcomes_id_idx";
  DROP INDEX "payload_locked_documents_rels_data_requests_id_idx";
  ALTER TABLE "users" DROP COLUMN "deleted_at";
  ALTER TABLE "schools" DROP COLUMN "licence_reminders";
  ALTER TABLE "classes" DROP COLUMN "grade";
  ALTER TABLE "consent_requests" DROP COLUMN "withdrawn_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "kka_outcomes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "data_requests_id";
  ALTER TABLE "platform_settings" DROP COLUMN "data_request_days";
  DROP TYPE "public"."enum_classes_grade";
  DROP TYPE "public"."enum_kka_outcomes_competencies";
  DROP TYPE "public"."enum_kka_outcomes_phase";
  DROP TYPE "public"."enum_kka_outcomes_element";
  DROP TYPE "public"."enum_kka_outcomes_status";
  DROP TYPE "public"."enum_data_requests_type";
  DROP TYPE "public"."enum_data_requests_status";`)
}
