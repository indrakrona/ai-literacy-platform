import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_analytics_events_name" AS ENUM('signed_up', 'consent_requested', 'consent_given', 'class_joined', 'lesson_started', 'lesson_completed', 'quiz_submitted', 'ai_message_sent', 'ai_message_flagged', 'shield_blocked', 'project_submitted', 'project_graded', 'badge_earned', 'challenge_joined', 'test_started', 'test_submitted', 'score_released', 'certificate_shared', 'checkout_started', 'payment_completed');
  CREATE TABLE "analytics_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" "enum_analytics_events_name" NOT NULL,
  	"aid" varchar NOT NULL,
  	"role" varchar,
  	"school" numeric,
  	"track" varchar,
  	"age_band" varchar,
  	"device" varchar,
  	"props" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_events_id" integer;
  CREATE INDEX "analytics_events_name_idx" ON "analytics_events" USING btree ("name");
  CREATE INDEX "analytics_events_aid_idx" ON "analytics_events" USING btree ("aid");
  CREATE INDEX "analytics_events_school_idx" ON "analytics_events" USING btree ("school");
  CREATE INDEX "analytics_events_updated_at_idx" ON "analytics_events" USING btree ("updated_at");
  CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_events_fk" FOREIGN KEY ("analytics_events_id") REFERENCES "public"."analytics_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_analytics_events_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "analytics_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "analytics_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_analytics_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_events_id";
  DROP TYPE "public"."enum_analytics_events_name";`)
}
