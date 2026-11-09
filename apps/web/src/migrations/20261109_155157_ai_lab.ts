import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_activities_competency" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum_ai_activities_tier" AS ENUM('fast', 'standard');
  CREATE TABLE "ai_activities_starter_prompts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "ai_activities_reflection" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "ai_activities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"competency" "enum_ai_activities_competency" NOT NULL,
  	"instructions" varchar NOT NULL,
  	"tier" "enum_ai_activities_tier" DEFAULT 'standard' NOT NULL,
  	"message_limit" numeric DEFAULT 12 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_activities_locales" (
  	"title" varchar NOT NULL,
  	"goal" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "ai_conversations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"activity_id" integer NOT NULL,
  	"school_id" integer,
  	"messages" jsonb NOT NULL,
  	"flags" jsonb,
  	"flagged" boolean DEFAULT false,
  	"tokens" numeric DEFAULT 0,
  	"provider" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "lessons" ADD COLUMN "ai_activity_id" integer;
  ALTER TABLE "_lessons_v" ADD COLUMN "version_ai_activity_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_activities_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_conversations_id" integer;
  ALTER TABLE "ai_activities_starter_prompts" ADD CONSTRAINT "ai_activities_starter_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_activities_reflection" ADD CONSTRAINT "ai_activities_reflection_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_activities_locales" ADD CONSTRAINT "ai_activities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_activity_id_ai_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ai_activities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ai_activities_starter_prompts_order_idx" ON "ai_activities_starter_prompts" USING btree ("_order");
  CREATE INDEX "ai_activities_starter_prompts_parent_id_idx" ON "ai_activities_starter_prompts" USING btree ("_parent_id");
  CREATE INDEX "ai_activities_starter_prompts_locale_idx" ON "ai_activities_starter_prompts" USING btree ("_locale");
  CREATE INDEX "ai_activities_reflection_order_idx" ON "ai_activities_reflection" USING btree ("_order");
  CREATE INDEX "ai_activities_reflection_parent_id_idx" ON "ai_activities_reflection" USING btree ("_parent_id");
  CREATE INDEX "ai_activities_reflection_locale_idx" ON "ai_activities_reflection" USING btree ("_locale");
  CREATE UNIQUE INDEX "ai_activities_slug_idx" ON "ai_activities" USING btree ("slug");
  CREATE INDEX "ai_activities_updated_at_idx" ON "ai_activities" USING btree ("updated_at");
  CREATE INDEX "ai_activities_created_at_idx" ON "ai_activities" USING btree ("created_at");
  CREATE UNIQUE INDEX "ai_activities_locales_locale_parent_id_unique" ON "ai_activities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ai_conversations_user_idx" ON "ai_conversations" USING btree ("user_id");
  CREATE INDEX "ai_conversations_activity_idx" ON "ai_conversations" USING btree ("activity_id");
  CREATE INDEX "ai_conversations_school_idx" ON "ai_conversations" USING btree ("school_id");
  CREATE INDEX "ai_conversations_flagged_idx" ON "ai_conversations" USING btree ("flagged");
  CREATE INDEX "ai_conversations_updated_at_idx" ON "ai_conversations" USING btree ("updated_at");
  CREATE INDEX "ai_conversations_created_at_idx" ON "ai_conversations" USING btree ("created_at");
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_ai_activity_id_ai_activities_id_fk" FOREIGN KEY ("ai_activity_id") REFERENCES "public"."ai_activities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_ai_activity_id_ai_activities_id_fk" FOREIGN KEY ("version_ai_activity_id") REFERENCES "public"."ai_activities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_activities_fk" FOREIGN KEY ("ai_activities_id") REFERENCES "public"."ai_activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_conversations_fk" FOREIGN KEY ("ai_conversations_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_ai_activity_idx" ON "lessons" USING btree ("ai_activity_id");
  CREATE INDEX "_lessons_v_version_version_ai_activity_idx" ON "_lessons_v" USING btree ("version_ai_activity_id");
  CREATE INDEX "payload_locked_documents_rels_ai_activities_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_activities_id");
  CREATE INDEX "payload_locked_documents_rels_ai_conversations_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_conversations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_activities_starter_prompts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_activities_reflection" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_activities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_activities_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_conversations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_activities_starter_prompts" CASCADE;
  DROP TABLE "ai_activities_reflection" CASCADE;
  DROP TABLE "ai_activities" CASCADE;
  DROP TABLE "ai_activities_locales" CASCADE;
  DROP TABLE "ai_conversations" CASCADE;
  ALTER TABLE "lessons" DROP CONSTRAINT "lessons_ai_activity_id_ai_activities_id_fk";
  
  ALTER TABLE "_lessons_v" DROP CONSTRAINT "_lessons_v_version_ai_activity_id_ai_activities_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_activities_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_conversations_fk";
  
  DROP INDEX "lessons_ai_activity_idx";
  DROP INDEX "_lessons_v_version_version_ai_activity_idx";
  DROP INDEX "payload_locked_documents_rels_ai_activities_id_idx";
  DROP INDEX "payload_locked_documents_rels_ai_conversations_id_idx";
  ALTER TABLE "lessons" DROP COLUMN "ai_activity_id";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_ai_activity_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_activities_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_conversations_id";
  DROP TYPE "public"."enum_ai_activities_competency";
  DROP TYPE "public"."enum_ai_activities_tier";`)
}
