import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "live_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"teacher_id" integer NOT NULL,
  	"class_id" integer,
  	"track" varchar NOT NULL,
  	"order" numeric NOT NULL,
  	"question" numeric,
  	"responses" jsonb,
  	"active" boolean DEFAULT true,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "live_sessions_id" integer;
  ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "live_sessions_code_idx" ON "live_sessions" USING btree ("code");
  CREATE INDEX "live_sessions_teacher_idx" ON "live_sessions" USING btree ("teacher_id");
  CREATE INDEX "live_sessions_class_idx" ON "live_sessions" USING btree ("class_id");
  CREATE INDEX "live_sessions_active_idx" ON "live_sessions" USING btree ("active");
  CREATE INDEX "live_sessions_updated_at_idx" ON "live_sessions" USING btree ("updated_at");
  CREATE INDEX "live_sessions_created_at_idx" ON "live_sessions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_live_sessions_fk" FOREIGN KEY ("live_sessions_id") REFERENCES "public"."live_sessions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_live_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("live_sessions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "live_sessions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "live_sessions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_live_sessions_fk";
  
  DROP INDEX "payload_locked_documents_rels_live_sessions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "live_sessions_id";`)
}
