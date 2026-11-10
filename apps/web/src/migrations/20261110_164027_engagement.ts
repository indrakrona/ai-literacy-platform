import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_challenges_mode" AS ENUM('individual', 'team');
  CREATE TYPE "public"."enum_events_type" AS ENUM('hackathon', 'challenge_week', 'demo_day');
  CREATE TYPE "public"."enum_events_status" AS ENUM('upcoming', 'open', 'judging', 'closed');
  CREATE TYPE "public"."enum_events_scope" AS ENUM('platform', 'school');
  CREATE TYPE "public"."enum_submissions_showcase" AS ENUM('none', 'nominated', 'published');
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'showcase_nominated';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'showcase_published';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'peer_review';
  CREATE TABLE "challenges_teams" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "events_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"max" numeric DEFAULT 5 NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_events_type" DEFAULT 'challenge_week' NOT NULL,
  	"status" "enum_events_status" DEFAULT 'upcoming' NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone NOT NULL,
  	"scope" "enum_events_scope" DEFAULT 'platform',
  	"school_id" integer,
  	"brief_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "peer_reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"submission_id" integer NOT NULL,
  	"reviewer_id" integer NOT NULL,
  	"class_id" integer,
  	"ratings" jsonb NOT NULL,
  	"praise" varchar NOT NULL,
  	"suggestion" varchar NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "showcase_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"submission_id" integer NOT NULL,
  	"voter_id" integer NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "hide_name_on_boards" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "gallery_parent_approved" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "portfolio_enabled" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "portfolio_handle" varchar;
  ALTER TABLE "users" ADD COLUMN "portfolio_headline" varchar;
  ALTER TABLE "users" ADD COLUMN "portfolio_show_projects" boolean DEFAULT true;
  ALTER TABLE "users" ADD COLUMN "portfolio_show_badges" boolean DEFAULT true;
  ALTER TABLE "users" ADD COLUMN "portfolio_show_certificate" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "portfolio_parent_approved" boolean DEFAULT false;
  ALTER TABLE "classes" ADD COLUMN "leaderboard_opt_in" boolean DEFAULT false;
  ALTER TABLE "challenges" ADD COLUMN "mode" "enum_challenges_mode" DEFAULT 'individual';
  ALTER TABLE "submissions" ADD COLUMN "showcase" "enum_submissions_showcase" DEFAULT 'none';
  ALTER TABLE "submissions" ADD COLUMN "showcase_at" timestamp(3) with time zone;
  ALTER TABLE "submissions" ADD COLUMN "votes" numeric DEFAULT 0;
  ALTER TABLE "submissions" ADD COLUMN "event_id" integer;
  ALTER TABLE "submissions" ADD COLUMN "judge_scores" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "peer_reviews_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "showcase_votes_id" integer;
  ALTER TABLE "challenges_teams" ADD CONSTRAINT "challenges_teams_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_criteria" ADD CONSTRAINT "events_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_brief_id_project_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."project_briefs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "showcase_votes" ADD CONSTRAINT "showcase_votes_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "showcase_votes" ADD CONSTRAINT "showcase_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "challenges_teams_order_idx" ON "challenges_teams" USING btree ("_order");
  CREATE INDEX "challenges_teams_parent_id_idx" ON "challenges_teams" USING btree ("_parent_id");
  CREATE INDEX "events_criteria_order_idx" ON "events_criteria" USING btree ("_order");
  CREATE INDEX "events_criteria_parent_id_idx" ON "events_criteria" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_school_idx" ON "events" USING btree ("school_id");
  CREATE INDEX "events_brief_idx" ON "events" USING btree ("brief_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
  CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
  CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
  CREATE INDEX "events_rels_users_id_idx" ON "events_rels" USING btree ("users_id");
  CREATE INDEX "peer_reviews_submission_idx" ON "peer_reviews" USING btree ("submission_id");
  CREATE INDEX "peer_reviews_reviewer_idx" ON "peer_reviews" USING btree ("reviewer_id");
  CREATE INDEX "peer_reviews_class_idx" ON "peer_reviews" USING btree ("class_id");
  CREATE UNIQUE INDEX "peer_reviews_key_idx" ON "peer_reviews" USING btree ("key");
  CREATE INDEX "peer_reviews_updated_at_idx" ON "peer_reviews" USING btree ("updated_at");
  CREATE INDEX "peer_reviews_created_at_idx" ON "peer_reviews" USING btree ("created_at");
  CREATE INDEX "showcase_votes_submission_idx" ON "showcase_votes" USING btree ("submission_id");
  CREATE INDEX "showcase_votes_voter_idx" ON "showcase_votes" USING btree ("voter_id");
  CREATE UNIQUE INDEX "showcase_votes_key_idx" ON "showcase_votes" USING btree ("key");
  CREATE INDEX "showcase_votes_updated_at_idx" ON "showcase_votes" USING btree ("updated_at");
  CREATE INDEX "showcase_votes_created_at_idx" ON "showcase_votes" USING btree ("created_at");
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_peer_reviews_fk" FOREIGN KEY ("peer_reviews_id") REFERENCES "public"."peer_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_showcase_votes_fk" FOREIGN KEY ("showcase_votes_id") REFERENCES "public"."showcase_votes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_portfolio_portfolio_handle_idx" ON "users" USING btree ("portfolio_handle");
  CREATE INDEX "submissions_showcase_idx" ON "submissions" USING btree ("showcase");
  CREATE INDEX "submissions_event_idx" ON "submissions" USING btree ("event_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_peer_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("peer_reviews_id");
  CREATE INDEX "payload_locked_documents_rels_showcase_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("showcase_votes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "challenges_teams" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_criteria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "peer_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "showcase_votes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "challenges_teams" CASCADE;
  DROP TABLE "events_criteria" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "events_rels" CASCADE;
  DROP TABLE "peer_reviews" CASCADE;
  DROP TABLE "showcase_votes" CASCADE;
  ALTER TABLE "submissions" DROP CONSTRAINT "submissions_event_id_events_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_peer_reviews_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_showcase_votes_fk";
  
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_notifications_kind";
  CREATE TYPE "public"."enum_notifications_kind" AS ENUM('assignment_new', 'submission_received', 'project_graded', 'score_ready', 'consent_granted', 'consent_declined', 'report_received', 'pilot_request', 'badge_earned', 'announcement', 'test_reminder', 'weekly_summary', 'child_linked', 'licence_expiring', 'data_request', 'consent_withdrawn', 'content_review', 'content_decision', 'ticket_new', 'ticket_reply');
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_notifications_kind" USING "kind"::"public"."enum_notifications_kind";
  DROP INDEX "users_portfolio_portfolio_handle_idx";
  DROP INDEX "submissions_showcase_idx";
  DROP INDEX "submissions_event_idx";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_peer_reviews_id_idx";
  DROP INDEX "payload_locked_documents_rels_showcase_votes_id_idx";
  ALTER TABLE "users" DROP COLUMN "hide_name_on_boards";
  ALTER TABLE "users" DROP COLUMN "gallery_parent_approved";
  ALTER TABLE "users" DROP COLUMN "portfolio_enabled";
  ALTER TABLE "users" DROP COLUMN "portfolio_handle";
  ALTER TABLE "users" DROP COLUMN "portfolio_headline";
  ALTER TABLE "users" DROP COLUMN "portfolio_show_projects";
  ALTER TABLE "users" DROP COLUMN "portfolio_show_badges";
  ALTER TABLE "users" DROP COLUMN "portfolio_show_certificate";
  ALTER TABLE "users" DROP COLUMN "portfolio_parent_approved";
  ALTER TABLE "classes" DROP COLUMN "leaderboard_opt_in";
  ALTER TABLE "challenges" DROP COLUMN "mode";
  ALTER TABLE "submissions" DROP COLUMN "showcase";
  ALTER TABLE "submissions" DROP COLUMN "showcase_at";
  ALTER TABLE "submissions" DROP COLUMN "votes";
  ALTER TABLE "submissions" DROP COLUMN "event_id";
  ALTER TABLE "submissions" DROP COLUMN "judge_scores";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "peer_reviews_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "showcase_votes_id";
  DROP TYPE "public"."enum_challenges_mode";
  DROP TYPE "public"."enum_events_type";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_events_scope";
  DROP TYPE "public"."enum_submissions_showcase";`)
}
