import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('student', 'parent', 'teacher', 'school_admin', 'candidate', 'content_editor', 'assessment_author', 'rater', 'proctor', 'super_admin');
  CREATE TYPE "public"."enum_users_preferred_locale" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum_users_consent_status" AS ENUM('not_required', 'pending', 'granted', 'declined');
  CREATE TYPE "public"."enum_schools_level" AS ENUM('smp', 'sma', 'smk');
  CREATE TYPE "public"."enum_tracks_level" AS ENUM('smp', 'sma_smk');
  CREATE TYPE "public"."enum_tracks_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__tracks_v_version_level" AS ENUM('smp', 'sma_smk');
  CREATE TYPE "public"."enum__tracks_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__tracks_v_published_locale" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum_units_big_idea" AS ENUM('discover', 'understand', 'create', 'protect', 'thrive');
  CREATE TYPE "public"."enum_units_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__units_v_version_big_idea" AS ENUM('discover', 'understand', 'create', 'protect', 'thrive');
  CREATE TYPE "public"."enum__units_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__units_v_published_locale" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum_lessons_type" AS ENUM('video', 'reading', 'interactive', 'quiz', 'ai_lab', 'project', 'discussion');
  CREATE TYPE "public"."enum_lessons_review_state" AS ENUM('draft', 'in_review', 'approved');
  CREATE TYPE "public"."enum_lessons_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_version_type" AS ENUM('video', 'reading', 'interactive', 'quiz', 'ai_lab', 'project', 'discussion');
  CREATE TYPE "public"."enum__lessons_v_version_review_state" AS ENUM('draft', 'in_review', 'approved');
  CREATE TYPE "public"."enum__lessons_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lessons_v_published_locale" AS ENUM('id', 'en');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"school_id" integer,
  	"date_of_birth" timestamp(3) with time zone,
  	"preferred_locale" "enum_users_preferred_locale" DEFAULT 'id',
  	"phone" varchar,
  	"consent_status" "enum_users_consent_status" DEFAULT 'not_required',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "schools" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"npsn" varchar,
  	"level" "enum_schools_level" NOT NULL,
  	"province" varchar,
  	"city" varchar,
  	"licence_seats" numeric DEFAULT 0,
  	"licence_starts_at" timestamp(3) with time zone,
  	"licence_ends_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "classes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"school_id" integer NOT NULL,
  	"academic_year" varchar DEFAULT '2026/2027' NOT NULL,
  	"track_id" integer,
  	"join_code" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "classes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "tracks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"level" "enum_tracks_level",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_tracks_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "tracks_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_tracks_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_level" "enum__tracks_v_version_level",
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__tracks_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__tracks_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_tracks_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "units" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"track_id" integer,
  	"big_idea" "enum_units_big_idea",
  	"order" numeric DEFAULT 1,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_units_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "units_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_units_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_track_id" integer,
  	"version_big_idea" "enum__units_v_version_big_idea",
  	"version_order" numeric DEFAULT 1,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__units_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__units_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_units_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "lessons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"unit_id" integer,
  	"type" "enum_lessons_type",
  	"order" numeric DEFAULT 1,
  	"estimated_minutes" numeric,
  	"review_state" "enum_lessons_review_state" DEFAULT 'draft',
  	"video_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lessons_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "lessons_locales" (
  	"title" varchar,
  	"objective" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_lessons_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_unit_id" integer,
  	"version_type" "enum__lessons_v_version_type",
  	"version_order" numeric DEFAULT 1,
  	"version_estimated_minutes" numeric,
  	"version_review_state" "enum__lessons_v_version_review_state" DEFAULT 'draft',
  	"version_video_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lessons_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__lessons_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_lessons_v_locales" (
  	"version_title" varchar,
  	"version_objective" varchar,
  	"version_content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"schools_id" integer,
  	"classes_id" integer,
  	"tracks_id" integer,
  	"units_id" integer,
  	"lessons_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "classes" ADD CONSTRAINT "classes_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "classes_rels" ADD CONSTRAINT "classes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "classes_rels" ADD CONSTRAINT "classes_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tracks_locales" ADD CONSTRAINT "tracks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tracks_v" ADD CONSTRAINT "_tracks_v_parent_id_tracks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tracks_v_locales" ADD CONSTRAINT "_tracks_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_tracks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "units" ADD CONSTRAINT "units_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "units_locales" ADD CONSTRAINT "units_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_units_v" ADD CONSTRAINT "_units_v_parent_id_units_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_units_v" ADD CONSTRAINT "_units_v_version_track_id_tracks_id_fk" FOREIGN KEY ("version_track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_units_v_locales" ADD CONSTRAINT "_units_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_units_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lessons_locales" ADD CONSTRAINT "lessons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_parent_id_lessons_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_unit_id_units_id_fk" FOREIGN KEY ("version_unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v" ADD CONSTRAINT "_lessons_v_version_video_id_media_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lessons_v_locales" ADD CONSTRAINT "_lessons_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_schools_fk" FOREIGN KEY ("schools_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_classes_fk" FOREIGN KEY ("classes_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_units_fk" FOREIGN KEY ("units_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_school_idx" ON "users" USING btree ("school_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_users_id_idx" ON "users_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "schools_npsn_idx" ON "schools" USING btree ("npsn");
  CREATE INDEX "schools_updated_at_idx" ON "schools" USING btree ("updated_at");
  CREATE INDEX "schools_created_at_idx" ON "schools" USING btree ("created_at");
  CREATE INDEX "classes_school_idx" ON "classes" USING btree ("school_id");
  CREATE INDEX "classes_track_idx" ON "classes" USING btree ("track_id");
  CREATE UNIQUE INDEX "classes_join_code_idx" ON "classes" USING btree ("join_code");
  CREATE INDEX "classes_updated_at_idx" ON "classes" USING btree ("updated_at");
  CREATE INDEX "classes_created_at_idx" ON "classes" USING btree ("created_at");
  CREATE INDEX "classes_rels_order_idx" ON "classes_rels" USING btree ("order");
  CREATE INDEX "classes_rels_parent_idx" ON "classes_rels" USING btree ("parent_id");
  CREATE INDEX "classes_rels_path_idx" ON "classes_rels" USING btree ("path");
  CREATE INDEX "classes_rels_users_id_idx" ON "classes_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "tracks_slug_idx" ON "tracks" USING btree ("slug");
  CREATE INDEX "tracks_updated_at_idx" ON "tracks" USING btree ("updated_at");
  CREATE INDEX "tracks_created_at_idx" ON "tracks" USING btree ("created_at");
  CREATE INDEX "tracks__status_idx" ON "tracks" USING btree ("_status");
  CREATE UNIQUE INDEX "tracks_locales_locale_parent_id_unique" ON "tracks_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_tracks_v_parent_idx" ON "_tracks_v" USING btree ("parent_id");
  CREATE INDEX "_tracks_v_version_version_slug_idx" ON "_tracks_v" USING btree ("version_slug");
  CREATE INDEX "_tracks_v_version_version_updated_at_idx" ON "_tracks_v" USING btree ("version_updated_at");
  CREATE INDEX "_tracks_v_version_version_created_at_idx" ON "_tracks_v" USING btree ("version_created_at");
  CREATE INDEX "_tracks_v_version_version__status_idx" ON "_tracks_v" USING btree ("version__status");
  CREATE INDEX "_tracks_v_created_at_idx" ON "_tracks_v" USING btree ("created_at");
  CREATE INDEX "_tracks_v_updated_at_idx" ON "_tracks_v" USING btree ("updated_at");
  CREATE INDEX "_tracks_v_snapshot_idx" ON "_tracks_v" USING btree ("snapshot");
  CREATE INDEX "_tracks_v_published_locale_idx" ON "_tracks_v" USING btree ("published_locale");
  CREATE INDEX "_tracks_v_latest_idx" ON "_tracks_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_tracks_v_locales_locale_parent_id_unique" ON "_tracks_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "units_track_idx" ON "units" USING btree ("track_id");
  CREATE INDEX "units_updated_at_idx" ON "units" USING btree ("updated_at");
  CREATE INDEX "units_created_at_idx" ON "units" USING btree ("created_at");
  CREATE INDEX "units__status_idx" ON "units" USING btree ("_status");
  CREATE UNIQUE INDEX "units_locales_locale_parent_id_unique" ON "units_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_units_v_parent_idx" ON "_units_v" USING btree ("parent_id");
  CREATE INDEX "_units_v_version_version_track_idx" ON "_units_v" USING btree ("version_track_id");
  CREATE INDEX "_units_v_version_version_updated_at_idx" ON "_units_v" USING btree ("version_updated_at");
  CREATE INDEX "_units_v_version_version_created_at_idx" ON "_units_v" USING btree ("version_created_at");
  CREATE INDEX "_units_v_version_version__status_idx" ON "_units_v" USING btree ("version__status");
  CREATE INDEX "_units_v_created_at_idx" ON "_units_v" USING btree ("created_at");
  CREATE INDEX "_units_v_updated_at_idx" ON "_units_v" USING btree ("updated_at");
  CREATE INDEX "_units_v_snapshot_idx" ON "_units_v" USING btree ("snapshot");
  CREATE INDEX "_units_v_published_locale_idx" ON "_units_v" USING btree ("published_locale");
  CREATE INDEX "_units_v_latest_idx" ON "_units_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_units_v_locales_locale_parent_id_unique" ON "_units_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lessons_unit_idx" ON "lessons" USING btree ("unit_id");
  CREATE INDEX "lessons_video_idx" ON "lessons" USING btree ("video_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE INDEX "lessons__status_idx" ON "lessons" USING btree ("_status");
  CREATE UNIQUE INDEX "lessons_locales_locale_parent_id_unique" ON "lessons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lessons_v_parent_idx" ON "_lessons_v" USING btree ("parent_id");
  CREATE INDEX "_lessons_v_version_version_unit_idx" ON "_lessons_v" USING btree ("version_unit_id");
  CREATE INDEX "_lessons_v_version_version_video_idx" ON "_lessons_v" USING btree ("version_video_id");
  CREATE INDEX "_lessons_v_version_version_updated_at_idx" ON "_lessons_v" USING btree ("version_updated_at");
  CREATE INDEX "_lessons_v_version_version_created_at_idx" ON "_lessons_v" USING btree ("version_created_at");
  CREATE INDEX "_lessons_v_version_version__status_idx" ON "_lessons_v" USING btree ("version__status");
  CREATE INDEX "_lessons_v_created_at_idx" ON "_lessons_v" USING btree ("created_at");
  CREATE INDEX "_lessons_v_updated_at_idx" ON "_lessons_v" USING btree ("updated_at");
  CREATE INDEX "_lessons_v_snapshot_idx" ON "_lessons_v" USING btree ("snapshot");
  CREATE INDEX "_lessons_v_published_locale_idx" ON "_lessons_v" USING btree ("published_locale");
  CREATE INDEX "_lessons_v_latest_idx" ON "_lessons_v" USING btree ("latest");
  CREATE INDEX "_lessons_v_autosave_idx" ON "_lessons_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_lessons_v_locales_locale_parent_id_unique" ON "_lessons_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_schools_id_idx" ON "payload_locked_documents_rels" USING btree ("schools_id");
  CREATE INDEX "payload_locked_documents_rels_classes_id_idx" ON "payload_locked_documents_rels" USING btree ("classes_id");
  CREATE INDEX "payload_locked_documents_rels_tracks_id_idx" ON "payload_locked_documents_rels" USING btree ("tracks_id");
  CREATE INDEX "payload_locked_documents_rels_units_id_idx" ON "payload_locked_documents_rels" USING btree ("units_id");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "schools" CASCADE;
  DROP TABLE "classes" CASCADE;
  DROP TABLE "classes_rels" CASCADE;
  DROP TABLE "tracks" CASCADE;
  DROP TABLE "tracks_locales" CASCADE;
  DROP TABLE "_tracks_v" CASCADE;
  DROP TABLE "_tracks_v_locales" CASCADE;
  DROP TABLE "units" CASCADE;
  DROP TABLE "units_locales" CASCADE;
  DROP TABLE "_units_v" CASCADE;
  DROP TABLE "_units_v_locales" CASCADE;
  DROP TABLE "lessons" CASCADE;
  DROP TABLE "lessons_locales" CASCADE;
  DROP TABLE "_lessons_v" CASCADE;
  DROP TABLE "_lessons_v_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_preferred_locale";
  DROP TYPE "public"."enum_users_consent_status";
  DROP TYPE "public"."enum_schools_level";
  DROP TYPE "public"."enum_tracks_level";
  DROP TYPE "public"."enum_tracks_status";
  DROP TYPE "public"."enum__tracks_v_version_level";
  DROP TYPE "public"."enum__tracks_v_version_status";
  DROP TYPE "public"."enum__tracks_v_published_locale";
  DROP TYPE "public"."enum_units_big_idea";
  DROP TYPE "public"."enum_units_status";
  DROP TYPE "public"."enum__units_v_version_big_idea";
  DROP TYPE "public"."enum__units_v_version_status";
  DROP TYPE "public"."enum__units_v_published_locale";
  DROP TYPE "public"."enum_lessons_type";
  DROP TYPE "public"."enum_lessons_review_state";
  DROP TYPE "public"."enum_lessons_status";
  DROP TYPE "public"."enum__lessons_v_version_type";
  DROP TYPE "public"."enum__lessons_v_version_review_state";
  DROP TYPE "public"."enum__lessons_v_version_status";
  DROP TYPE "public"."enum__lessons_v_published_locale";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
