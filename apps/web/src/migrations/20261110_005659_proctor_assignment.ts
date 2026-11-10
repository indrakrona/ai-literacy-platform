import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "test_forms" ADD COLUMN "school_id" integer;
  ALTER TABLE "test_forms_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "test_forms" ADD CONSTRAINT "test_forms_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "test_forms_rels" ADD CONSTRAINT "test_forms_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "test_forms_school_idx" ON "test_forms" USING btree ("school_id");
  CREATE INDEX "test_forms_rels_users_id_idx" ON "test_forms_rels" USING btree ("users_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "test_forms" DROP CONSTRAINT "test_forms_school_id_schools_id_fk";
  
  ALTER TABLE "test_forms_rels" DROP CONSTRAINT "test_forms_rels_users_fk";
  
  DROP INDEX "test_forms_school_idx";
  DROP INDEX "test_forms_rels_users_id_idx";
  ALTER TABLE "test_forms" DROP COLUMN "school_id";
  ALTER TABLE "test_forms_rels" DROP COLUMN "users_id";`)
}
