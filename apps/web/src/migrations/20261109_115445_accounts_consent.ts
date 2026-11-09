import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_consent_requests_status" AS ENUM('pending', 'granted', 'declined', 'expired');
  CREATE TABLE "consent_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"student_id" integer NOT NULL,
  	"guardian_name" varchar,
  	"guardian_email" varchar,
  	"guardian_phone" varchar,
  	"token" varchar NOT NULL,
  	"status" "enum_consent_requests_status" DEFAULT 'pending' NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"decided_at" timestamp(3) with time zone,
  	"consent_version" varchar NOT NULL,
  	"decision_ip" varchar,
  	"decision_user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "notify_email" boolean DEFAULT true;
  ALTER TABLE "users" ADD COLUMN "notify_whats_app" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "show_in_showcase" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consent_requests_id" integer;
  ALTER TABLE "consent_requests" ADD CONSTRAINT "consent_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "consent_requests_student_idx" ON "consent_requests" USING btree ("student_id");
  CREATE UNIQUE INDEX "consent_requests_token_idx" ON "consent_requests" USING btree ("token");
  CREATE INDEX "consent_requests_updated_at_idx" ON "consent_requests" USING btree ("updated_at");
  CREATE INDEX "consent_requests_created_at_idx" ON "consent_requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consent_requests_fk" FOREIGN KEY ("consent_requests_id") REFERENCES "public"."consent_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_consent_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("consent_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "consent_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "consent_requests" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consent_requests_fk";
  
  DROP INDEX "payload_locked_documents_rels_consent_requests_id_idx";
  ALTER TABLE "users" DROP COLUMN "notify_email";
  ALTER TABLE "users" DROP COLUMN "notify_whats_app";
  ALTER TABLE "users" DROP COLUMN "show_in_showcase";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "consent_requests_id";
  DROP TYPE "public"."enum_consent_requests_status";`)
}
