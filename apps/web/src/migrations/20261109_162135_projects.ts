import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_project_briefs_level" AS ENUM('smp', 'sma_smk');
  CREATE TYPE "public"."enum_project_briefs_competency" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum_project_briefs_smk_major" AS ENUM('akuntansi', 'pemasaran', 'tjkt', 'pplg', 'perhotelan', 'kuliner', 'otomotif', 'dkv', 'kesehatan');
  CREATE TYPE "public"."enum_submissions_status" AS ENUM('submitted', 'graded');
  CREATE TABLE "project_briefs_rubric" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "project_briefs_rubric_locales" (
  	"criterion" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "project_briefs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"level" "enum_project_briefs_level" NOT NULL,
  	"competency" "enum_project_briefs_competency" NOT NULL,
  	"smk_major" "enum_project_briefs_smk_major",
  	"allow_teams" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "project_briefs_locales" (
  	"title" varchar NOT NULL,
  	"client" varchar,
  	"problem" varchar NOT NULL,
  	"deliverables" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "submissions_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brief_id" integer NOT NULL,
  	"class_id" integer NOT NULL,
  	"text" varchar NOT NULL,
  	"status" "enum_submissions_status" DEFAULT 'submitted' NOT NULL,
  	"submitted_at" timestamp(3) with time zone,
  	"scores" jsonb,
  	"feedback" varchar,
  	"graded_by_id" integer,
  	"graded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "submissions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  ALTER TABLE "lessons" ADD COLUMN "project_brief_id" integer;
  ALTER TABLE "_lessons_v" ADD COLUMN "version_project_brief_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "project_briefs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "submissions_id" integer;
  ALTER TABLE "project_briefs_rubric" ADD CONSTRAINT "project_briefs_rubric_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."project_briefs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "project_briefs_rubric_locales" ADD CONSTRAINT "project_briefs_rubric_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."project_briefs_rubric"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "project_briefs_locales" ADD CONSTRAINT "project_briefs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."project_briefs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_links" ADD CONSTRAINT "submissions_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_brief_id_project_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."project_briefs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_graded_by_id_users_id_fk" FOREIGN KEY ("graded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "project_briefs_rubric_order_idx" ON "project_briefs_rubric" USING btree ("_order");
  CREATE INDEX "project_briefs_rubric_parent_id_idx" ON "project_briefs_rubric" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "project_briefs_rubric_locales_locale_parent_id_unique" ON "project_briefs_rubric_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "project_briefs_slug_idx" ON "project_briefs" USING btree ("slug");
  CREATE INDEX "project_briefs_updated_at_idx" ON "project_briefs" USING btree ("updated_at");
  CREATE INDEX "project_briefs_created_at_idx" ON "project_briefs" USING btree ("created_at");
  CREATE UNIQUE INDEX "project_briefs_locales_locale_parent_id_unique" ON "project_briefs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "submissions_links_order_idx" ON "submissions_links" USING btree ("_order");
  CREATE INDEX "submissions_links_parent_id_idx" ON "submissions_links" USING btree ("_parent_id");
  CREATE INDEX "submissions_brief_idx" ON "submissions" USING btree ("brief_id");
  CREATE INDEX "submissions_class_idx" ON "submissions" USING btree ("class_id");
  CREATE INDEX "submissions_graded_by_idx" ON "submissions" USING btree ("graded_by_id");
  CREATE INDEX "submissions_updated_at_idx" ON "submissions" USING btree ("updated_at");
  CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");
  CREATE INDEX "submissions_rels_order_idx" ON "submissions_rels" USING btree ("order");
  CREATE INDEX "submissions_rels_parent_idx" ON "submissions_rels" USING btree ("parent_id");
  CREATE INDEX "submissions_rels_path_idx" ON "submissions_rels" USING btree ("path");
  CREATE INDEX "submissions_rels_users_id_idx" ON "submissions_rels" USING btree ("users_id");
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_project_brief_id_project_briefs_id_fk" FOREIGN KEY ("project_brief_id") REFERENCES "public"."project_briefs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_project_brief_id_project_briefs_id_fk" FOREIGN KEY ("version_project_brief_id") REFERENCES "public"."project_briefs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_project_briefs_fk" FOREIGN KEY ("project_briefs_id") REFERENCES "public"."project_briefs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submissions_fk" FOREIGN KEY ("submissions_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_project_brief_idx" ON "lessons" USING btree ("project_brief_id");
  CREATE INDEX "_lessons_v_version_version_project_brief_idx" ON "_lessons_v" USING btree ("version_project_brief_id");
  CREATE INDEX "payload_locked_documents_rels_project_briefs_id_idx" ON "payload_locked_documents_rels" USING btree ("project_briefs_id");
  CREATE INDEX "payload_locked_documents_rels_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("submissions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "project_briefs_rubric" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_briefs_rubric_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_briefs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_briefs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "project_briefs_rubric" CASCADE;
  DROP TABLE "project_briefs_rubric_locales" CASCADE;
  DROP TABLE "project_briefs" CASCADE;
  DROP TABLE "project_briefs_locales" CASCADE;
  DROP TABLE "submissions_links" CASCADE;
  DROP TABLE "submissions" CASCADE;
  DROP TABLE "submissions_rels" CASCADE;
  ALTER TABLE "lessons" DROP CONSTRAINT "lessons_project_brief_id_project_briefs_id_fk";
  
  ALTER TABLE "_lessons_v" DROP CONSTRAINT "_lessons_v_version_project_brief_id_project_briefs_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_project_briefs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_submissions_fk";
  
  DROP INDEX "lessons_project_brief_idx";
  DROP INDEX "_lessons_v_version_version_project_brief_idx";
  DROP INDEX "payload_locked_documents_rels_project_briefs_id_idx";
  DROP INDEX "payload_locked_documents_rels_submissions_id_idx";
  ALTER TABLE "lessons" DROP COLUMN "project_brief_id";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_project_brief_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "project_briefs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "submissions_id";
  DROP TYPE "public"."enum_project_briefs_level";
  DROP TYPE "public"."enum_project_briefs_competency";
  DROP TYPE "public"."enum_project_briefs_smk_major";
  DROP TYPE "public"."enum_submissions_status";`)
}
