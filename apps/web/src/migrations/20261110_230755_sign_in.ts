import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_login_codes_channel" AS ENUM('email', 'whatsapp');
  CREATE TABLE "login_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"channel" "enum_login_codes_channel",
  	"attempts" numeric DEFAULT 0,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"used_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "google_sub" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "login_codes_id" integer;
  ALTER TABLE "login_codes" ADD CONSTRAINT "login_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "login_codes_user_idx" ON "login_codes" USING btree ("user_id");
  CREATE INDEX "login_codes_updated_at_idx" ON "login_codes" USING btree ("updated_at");
  CREATE INDEX "login_codes_created_at_idx" ON "login_codes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_login_codes_fk" FOREIGN KEY ("login_codes_id") REFERENCES "public"."login_codes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_google_sub_idx" ON "users" USING btree ("google_sub");
  CREATE INDEX "payload_locked_documents_rels_login_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("login_codes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "login_codes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "login_codes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_login_codes_fk";
  
  DROP INDEX "users_google_sub_idx";
  DROP INDEX "payload_locked_documents_rels_login_codes_id_idx";
  ALTER TABLE "users" DROP COLUMN "google_sub";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "login_codes_id";
  DROP TYPE "public"."enum_login_codes_channel";`)
}
