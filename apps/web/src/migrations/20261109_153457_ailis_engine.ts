import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_test_items_type" AS ENUM('single_choice', 'multiple_choice', 'scenario_judgment', 'performance_task');
  CREATE TYPE "public"."enum_test_items_competency" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum_test_items_level" AS ENUM('smp', 'sma_smk', 'adult');
  CREATE TYPE "public"."enum_test_items_difficulty" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum_test_items_state" AS ENUM('draft', 'review', 'approved', 'piloted', 'live', 'retired');
  CREATE TYPE "public"."enum__test_items_v_version_type" AS ENUM('single_choice', 'multiple_choice', 'scenario_judgment', 'performance_task');
  CREATE TYPE "public"."enum__test_items_v_version_competency" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum__test_items_v_version_level" AS ENUM('smp', 'sma_smk', 'adult');
  CREATE TYPE "public"."enum__test_items_v_version_difficulty" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum__test_items_v_version_state" AS ENUM('draft', 'review', 'approved', 'piloted', 'live', 'retired');
  CREATE TYPE "public"."enum_test_forms_item_states" AS ENUM('approved', 'piloted', 'live');
  CREATE TYPE "public"."enum_test_forms_level" AS ENUM('smp', 'sma_smk', 'adult');
  CREATE TYPE "public"."enum_test_forms_status" AS ENUM('draft', 'active', 'closed');
  CREATE TYPE "public"."enum_test_attempts_status" AS ENUM('in_progress', 'awaiting_rating', 'scored');
  CREATE TABLE "test_items_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"correct" boolean DEFAULT false
  );
  
  CREATE TABLE "test_items_options_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "test_items_rubric" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"points" numeric
  );
  
  CREATE TABLE "test_items_rubric_locales" (
  	"descriptor" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "test_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"type" "enum_test_items_type" NOT NULL,
  	"competency" "enum_test_items_competency" NOT NULL,
  	"level" "enum_test_items_level" DEFAULT 'sma_smk' NOT NULL,
  	"difficulty" "enum_test_items_difficulty" DEFAULT '2' NOT NULL,
  	"state" "enum_test_items_state" DEFAULT 'draft' NOT NULL,
  	"reviewer_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "test_items_locales" (
  	"scenario" varchar,
  	"stem" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_test_items_v_version_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"correct" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_test_items_v_version_options_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_test_items_v_version_rubric" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"points" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_test_items_v_version_rubric_locales" (
  	"descriptor" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_test_items_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_code" varchar NOT NULL,
  	"version_type" "enum__test_items_v_version_type" NOT NULL,
  	"version_competency" "enum__test_items_v_version_competency" NOT NULL,
  	"version_level" "enum__test_items_v_version_level" DEFAULT 'sma_smk' NOT NULL,
  	"version_difficulty" "enum__test_items_v_version_difficulty" DEFAULT '2' NOT NULL,
  	"version_state" "enum__test_items_v_version_state" DEFAULT 'draft' NOT NULL,
  	"version_reviewer_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_test_items_v_locales" (
  	"version_scenario" varchar,
  	"version_stem" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "test_forms_item_states" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_test_forms_item_states",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "test_forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"level" "enum_test_forms_level" DEFAULT 'sma_smk' NOT NULL,
  	"status" "enum_test_forms_status" DEFAULT 'draft' NOT NULL,
  	"time_limit_minutes" numeric DEFAULT 60 NOT NULL,
  	"blueprint_items_per_domain" numeric DEFAULT 6 NOT NULL,
  	"blueprint_performance_tasks" numeric DEFAULT 1 NOT NULL,
  	"access_code" varchar,
  	"seed" numeric,
  	"shortfall" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "test_forms_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"test_items_id" integer
  );
  
  CREATE TABLE "test_attempts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"form_id" integer NOT NULL,
  	"status" "enum_test_attempts_status" DEFAULT 'in_progress' NOT NULL,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"deadline" timestamp(3) with time zone NOT NULL,
  	"submitted_at" timestamp(3) with time zone,
  	"item_order" jsonb NOT NULL,
  	"responses" jsonb,
  	"points" jsonb,
  	"ratings" jsonb,
  	"integrity" jsonb,
  	"report" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "test_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "test_forms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "test_attempts_id" integer;
  ALTER TABLE "test_items_options" ADD CONSTRAINT "test_items_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."test_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "test_items_options_locales" ADD CONSTRAINT "test_items_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."test_items_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "test_items_rubric" ADD CONSTRAINT "test_items_rubric_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."test_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "test_items_rubric_locales" ADD CONSTRAINT "test_items_rubric_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."test_items_rubric"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "test_items_locales" ADD CONSTRAINT "test_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."test_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_test_items_v_version_options" ADD CONSTRAINT "_test_items_v_version_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_test_items_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_test_items_v_version_options_locales" ADD CONSTRAINT "_test_items_v_version_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_test_items_v_version_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_test_items_v_version_rubric" ADD CONSTRAINT "_test_items_v_version_rubric_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_test_items_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_test_items_v_version_rubric_locales" ADD CONSTRAINT "_test_items_v_version_rubric_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_test_items_v_version_rubric"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_test_items_v" ADD CONSTRAINT "_test_items_v_parent_id_test_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."test_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_test_items_v_locales" ADD CONSTRAINT "_test_items_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_test_items_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "test_forms_item_states" ADD CONSTRAINT "test_forms_item_states_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."test_forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "test_forms_rels" ADD CONSTRAINT "test_forms_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."test_forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "test_forms_rels" ADD CONSTRAINT "test_forms_rels_test_items_fk" FOREIGN KEY ("test_items_id") REFERENCES "public"."test_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_form_id_test_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."test_forms"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "test_items_options_order_idx" ON "test_items_options" USING btree ("_order");
  CREATE INDEX "test_items_options_parent_id_idx" ON "test_items_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "test_items_options_locales_locale_parent_id_unique" ON "test_items_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "test_items_rubric_order_idx" ON "test_items_rubric" USING btree ("_order");
  CREATE INDEX "test_items_rubric_parent_id_idx" ON "test_items_rubric" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "test_items_rubric_locales_locale_parent_id_unique" ON "test_items_rubric_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "test_items_code_idx" ON "test_items" USING btree ("code");
  CREATE INDEX "test_items_updated_at_idx" ON "test_items" USING btree ("updated_at");
  CREATE INDEX "test_items_created_at_idx" ON "test_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "test_items_locales_locale_parent_id_unique" ON "test_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_test_items_v_version_options_order_idx" ON "_test_items_v_version_options" USING btree ("_order");
  CREATE INDEX "_test_items_v_version_options_parent_id_idx" ON "_test_items_v_version_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_test_items_v_version_options_locales_locale_parent_id_uniqu" ON "_test_items_v_version_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_test_items_v_version_rubric_order_idx" ON "_test_items_v_version_rubric" USING btree ("_order");
  CREATE INDEX "_test_items_v_version_rubric_parent_id_idx" ON "_test_items_v_version_rubric" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_test_items_v_version_rubric_locales_locale_parent_id_unique" ON "_test_items_v_version_rubric_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_test_items_v_parent_idx" ON "_test_items_v" USING btree ("parent_id");
  CREATE INDEX "_test_items_v_version_version_code_idx" ON "_test_items_v" USING btree ("version_code");
  CREATE INDEX "_test_items_v_version_version_updated_at_idx" ON "_test_items_v" USING btree ("version_updated_at");
  CREATE INDEX "_test_items_v_version_version_created_at_idx" ON "_test_items_v" USING btree ("version_created_at");
  CREATE INDEX "_test_items_v_created_at_idx" ON "_test_items_v" USING btree ("created_at");
  CREATE INDEX "_test_items_v_updated_at_idx" ON "_test_items_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_test_items_v_locales_locale_parent_id_unique" ON "_test_items_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "test_forms_item_states_order_idx" ON "test_forms_item_states" USING btree ("order");
  CREATE INDEX "test_forms_item_states_parent_idx" ON "test_forms_item_states" USING btree ("parent_id");
  CREATE UNIQUE INDEX "test_forms_access_code_idx" ON "test_forms" USING btree ("access_code");
  CREATE INDEX "test_forms_updated_at_idx" ON "test_forms" USING btree ("updated_at");
  CREATE INDEX "test_forms_created_at_idx" ON "test_forms" USING btree ("created_at");
  CREATE INDEX "test_forms_rels_order_idx" ON "test_forms_rels" USING btree ("order");
  CREATE INDEX "test_forms_rels_parent_idx" ON "test_forms_rels" USING btree ("parent_id");
  CREATE INDEX "test_forms_rels_path_idx" ON "test_forms_rels" USING btree ("path");
  CREATE INDEX "test_forms_rels_test_items_id_idx" ON "test_forms_rels" USING btree ("test_items_id");
  CREATE INDEX "test_attempts_candidate_idx" ON "test_attempts" USING btree ("candidate_id");
  CREATE INDEX "test_attempts_form_idx" ON "test_attempts" USING btree ("form_id");
  CREATE INDEX "test_attempts_updated_at_idx" ON "test_attempts" USING btree ("updated_at");
  CREATE INDEX "test_attempts_created_at_idx" ON "test_attempts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_test_items_fk" FOREIGN KEY ("test_items_id") REFERENCES "public"."test_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_test_forms_fk" FOREIGN KEY ("test_forms_id") REFERENCES "public"."test_forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_test_attempts_fk" FOREIGN KEY ("test_attempts_id") REFERENCES "public"."test_attempts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_test_items_id_idx" ON "payload_locked_documents_rels" USING btree ("test_items_id");
  CREATE INDEX "payload_locked_documents_rels_test_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("test_forms_id");
  CREATE INDEX "payload_locked_documents_rels_test_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("test_attempts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "test_items_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_items_options_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_items_rubric" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_items_rubric_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_test_items_v_version_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_test_items_v_version_options_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_test_items_v_version_rubric" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_test_items_v_version_rubric_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_test_items_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_test_items_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_forms_item_states" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_forms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_forms_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_attempts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "test_items_options" CASCADE;
  DROP TABLE "test_items_options_locales" CASCADE;
  DROP TABLE "test_items_rubric" CASCADE;
  DROP TABLE "test_items_rubric_locales" CASCADE;
  DROP TABLE "test_items" CASCADE;
  DROP TABLE "test_items_locales" CASCADE;
  DROP TABLE "_test_items_v_version_options" CASCADE;
  DROP TABLE "_test_items_v_version_options_locales" CASCADE;
  DROP TABLE "_test_items_v_version_rubric" CASCADE;
  DROP TABLE "_test_items_v_version_rubric_locales" CASCADE;
  DROP TABLE "_test_items_v" CASCADE;
  DROP TABLE "_test_items_v_locales" CASCADE;
  DROP TABLE "test_forms_item_states" CASCADE;
  DROP TABLE "test_forms" CASCADE;
  DROP TABLE "test_forms_rels" CASCADE;
  DROP TABLE "test_attempts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_test_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_test_forms_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_test_attempts_fk";
  
  DROP INDEX "payload_locked_documents_rels_test_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_test_forms_id_idx";
  DROP INDEX "payload_locked_documents_rels_test_attempts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "test_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "test_forms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "test_attempts_id";
  DROP TYPE "public"."enum_test_items_type";
  DROP TYPE "public"."enum_test_items_competency";
  DROP TYPE "public"."enum_test_items_level";
  DROP TYPE "public"."enum_test_items_difficulty";
  DROP TYPE "public"."enum_test_items_state";
  DROP TYPE "public"."enum__test_items_v_version_type";
  DROP TYPE "public"."enum__test_items_v_version_competency";
  DROP TYPE "public"."enum__test_items_v_version_level";
  DROP TYPE "public"."enum__test_items_v_version_difficulty";
  DROP TYPE "public"."enum__test_items_v_version_state";
  DROP TYPE "public"."enum_test_forms_item_states";
  DROP TYPE "public"."enum_test_forms_level";
  DROP TYPE "public"."enum_test_forms_status";
  DROP TYPE "public"."enum_test_attempts_status";`)
}
