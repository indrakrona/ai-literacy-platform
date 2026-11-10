import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_accommodations_extra_time_percent" AS ENUM('0', '25', '50', '100');
  CREATE TABLE "accommodations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"candidate_id" integer NOT NULL,
  	"school_id" integer,
  	"extra_time_percent" "enum_accommodations_extra_time_percent" DEFAULT '0',
  	"large_text" boolean,
  	"high_contrast" boolean,
  	"screen_reader" boolean,
  	"reason" varchar,
  	"valid_until" timestamp(3) with time zone,
  	"granted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "test_attempts" ADD COLUMN "accommodations" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "accommodations_id" integer;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "accommodations_candidate_idx" ON "accommodations" USING btree ("candidate_id");
  CREATE INDEX "accommodations_school_idx" ON "accommodations" USING btree ("school_id");
  CREATE INDEX "accommodations_granted_by_idx" ON "accommodations" USING btree ("granted_by_id");
  CREATE INDEX "accommodations_updated_at_idx" ON "accommodations" USING btree ("updated_at");
  CREATE INDEX "accommodations_created_at_idx" ON "accommodations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_accommodations_fk" FOREIGN KEY ("accommodations_id") REFERENCES "public"."accommodations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_accommodations_id_idx" ON "payload_locked_documents_rels" USING btree ("accommodations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "accommodations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "accommodations" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_accommodations_fk";
  
  DROP INDEX "payload_locked_documents_rels_accommodations_id_idx";
  ALTER TABLE "test_attempts" DROP COLUMN "accommodations";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "accommodations_id";
  DROP TYPE "public"."enum_accommodations_extra_time_percent";`)
}
