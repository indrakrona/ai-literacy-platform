import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor_id" integer,
  	"action" varchar NOT NULL,
  	"target_collection" varchar,
  	"doc_id" varchar,
  	"summary" varchar,
  	"ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "platform_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"signups_open" boolean DEFAULT true,
  	"ai_lab_enabled" boolean DEFAULT true,
  	"tests_enabled" boolean DEFAULT true,
  	"projects_enabled" boolean DEFAULT true,
  	"student_daily_messages" numeric DEFAULT 60,
  	"school_daily_tokens" numeric DEFAULT 400000,
  	"daily_ai_budget_usd" numeric DEFAULT 20,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "platform_settings_locales" (
  	"maintenance_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "suspended" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_logs_id" integer;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "platform_settings_locales" ADD CONSTRAINT "platform_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."platform_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");
  CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "audit_logs_target_collection_idx" ON "audit_logs" USING btree ("target_collection");
  CREATE INDEX "audit_logs_doc_id_idx" ON "audit_logs" USING btree ("doc_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "platform_settings_locales_locale_parent_id_unique" ON "platform_settings_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_suspended_idx" ON "users" USING btree ("suspended");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "audit_logs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "platform_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "platform_settings_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "platform_settings" CASCADE;
  DROP TABLE "platform_settings_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_logs_fk";
  
  DROP INDEX "users_suspended_idx";
  DROP INDEX "payload_locked_documents_rels_audit_logs_id_idx";
  ALTER TABLE "users" DROP COLUMN "suspended";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_logs_id";`)
}
