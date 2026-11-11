import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_teacher_certifications_status" AS ENUM('valid', 'revoked');
  CREATE TABLE "teacher_certifications_attempts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone NOT NULL,
  	"correct" numeric NOT NULL,
  	"total" numeric NOT NULL,
  	"passed" boolean
  );
  
  CREATE TABLE "teacher_certifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"modules_done" jsonb,
  	"passed_at" timestamp(3) with time zone,
  	"code" varchar,
  	"issued_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"status" "enum_teacher_certifications_status" DEFAULT 'valid',
  	"revoked_reason" varchar,
  	"revoked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "teacher_certifications_id" integer;
  ALTER TABLE "teacher_certifications_attempts" ADD CONSTRAINT "teacher_certifications_attempts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."teacher_certifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "teacher_certifications" ADD CONSTRAINT "teacher_certifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "teacher_certifications_attempts_order_idx" ON "teacher_certifications_attempts" USING btree ("_order");
  CREATE INDEX "teacher_certifications_attempts_parent_id_idx" ON "teacher_certifications_attempts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "teacher_certifications_user_idx" ON "teacher_certifications" USING btree ("user_id");
  CREATE UNIQUE INDEX "teacher_certifications_code_idx" ON "teacher_certifications" USING btree ("code");
  CREATE INDEX "teacher_certifications_updated_at_idx" ON "teacher_certifications" USING btree ("updated_at");
  CREATE INDEX "teacher_certifications_created_at_idx" ON "teacher_certifications" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teacher_certifications_fk" FOREIGN KEY ("teacher_certifications_id") REFERENCES "public"."teacher_certifications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_teacher_certifications_id_idx" ON "payload_locked_documents_rels" USING btree ("teacher_certifications_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "teacher_certifications_attempts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "teacher_certifications" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "teacher_certifications_attempts" CASCADE;
  DROP TABLE "teacher_certifications" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_teacher_certifications_fk";
  
  DROP INDEX "payload_locked_documents_rels_teacher_certifications_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "teacher_certifications_id";
  DROP TYPE "public"."enum_teacher_certifications_status";`)
}
