import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_certificates_status" AS ENUM('valid', 'revoked');
  CREATE TYPE "public"."enum_test_sessions_status" AS ENUM('open', 'closed');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('booked', 'awaiting_payment', 'attended', 'cancelled');
  CREATE TABLE "certificates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"attempt_id" integer NOT NULL,
  	"level" varchar,
  	"band" numeric NOT NULL,
  	"overall" numeric,
  	"sub_scores" jsonb,
  	"provisional" boolean,
  	"issued_at" timestamp(3) with time zone NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"status" "enum_certificates_status" DEFAULT 'valid' NOT NULL,
  	"revoked_reason" varchar,
  	"revoked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "test_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"form_id" integer NOT NULL,
  	"school_id" integer,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone,
  	"location" varchar,
  	"seats" numeric DEFAULT 30 NOT NULL,
  	"price_idr" numeric DEFAULT 0,
  	"status" "enum_test_sessions_status" DEFAULT 'open' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vouchers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"batch" varchar NOT NULL,
  	"school_id" integer,
  	"discount_percent" numeric DEFAULT 100 NOT NULL,
  	"max_uses" numeric DEFAULT 1 NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"active" boolean DEFAULT true,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" integer NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"school_id" integer,
  	"status" "enum_bookings_status" DEFAULT 'booked' NOT NULL,
  	"voucher_id" integer,
  	"price_idr" numeric,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "certificates_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "test_sessions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vouchers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bookings_id" integer;
  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_form_id_test_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."test_forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_session_id_test_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."test_sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "certificates_code_idx" ON "certificates" USING btree ("code");
  CREATE INDEX "certificates_candidate_idx" ON "certificates" USING btree ("candidate_id");
  CREATE UNIQUE INDEX "certificates_attempt_idx" ON "certificates" USING btree ("attempt_id");
  CREATE INDEX "certificates_updated_at_idx" ON "certificates" USING btree ("updated_at");
  CREATE INDEX "certificates_created_at_idx" ON "certificates" USING btree ("created_at");
  CREATE INDEX "test_sessions_form_idx" ON "test_sessions" USING btree ("form_id");
  CREATE INDEX "test_sessions_school_idx" ON "test_sessions" USING btree ("school_id");
  CREATE INDEX "test_sessions_updated_at_idx" ON "test_sessions" USING btree ("updated_at");
  CREATE INDEX "test_sessions_created_at_idx" ON "test_sessions" USING btree ("created_at");
  CREATE UNIQUE INDEX "vouchers_code_idx" ON "vouchers" USING btree ("code");
  CREATE INDEX "vouchers_batch_idx" ON "vouchers" USING btree ("batch");
  CREATE INDEX "vouchers_school_idx" ON "vouchers" USING btree ("school_id");
  CREATE INDEX "vouchers_created_by_idx" ON "vouchers" USING btree ("created_by_id");
  CREATE INDEX "vouchers_updated_at_idx" ON "vouchers" USING btree ("updated_at");
  CREATE INDEX "vouchers_created_at_idx" ON "vouchers" USING btree ("created_at");
  CREATE INDEX "bookings_session_idx" ON "bookings" USING btree ("session_id");
  CREATE INDEX "bookings_candidate_idx" ON "bookings" USING btree ("candidate_id");
  CREATE INDEX "bookings_school_idx" ON "bookings" USING btree ("school_id");
  CREATE INDEX "bookings_voucher_idx" ON "bookings" USING btree ("voucher_id");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_certificates_fk" FOREIGN KEY ("certificates_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_test_sessions_fk" FOREIGN KEY ("test_sessions_id") REFERENCES "public"."test_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vouchers_fk" FOREIGN KEY ("vouchers_id") REFERENCES "public"."vouchers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_certificates_id_idx" ON "payload_locked_documents_rels" USING btree ("certificates_id");
  CREATE INDEX "payload_locked_documents_rels_test_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("test_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_vouchers_id_idx" ON "payload_locked_documents_rels" USING btree ("vouchers_id");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "certificates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "test_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vouchers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bookings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "certificates" CASCADE;
  DROP TABLE "test_sessions" CASCADE;
  DROP TABLE "vouchers" CASCADE;
  DROP TABLE "bookings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_certificates_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_test_sessions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vouchers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bookings_fk";
  
  DROP INDEX "payload_locked_documents_rels_certificates_id_idx";
  DROP INDEX "payload_locked_documents_rels_test_sessions_id_idx";
  DROP INDEX "payload_locked_documents_rels_vouchers_id_idx";
  DROP INDEX "payload_locked_documents_rels_bookings_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "certificates_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "test_sessions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vouchers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bookings_id";
  DROP TYPE "public"."enum_certificates_status";
  DROP TYPE "public"."enum_test_sessions_status";
  DROP TYPE "public"."enum_bookings_status";`)
}
