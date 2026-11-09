import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lessons_also_covers" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum_lessons_competency" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum__lessons_v_version_also_covers" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TYPE "public"."enum__lessons_v_version_competency" AS ENUM('DIS-1', 'DIS-2', 'DIS-3', 'UND-1', 'UND-2', 'UND-3', 'CRE-1', 'CRE-2', 'CRE-3', 'PRO-1', 'PRO-2', 'PRO-3', 'THR-1', 'THR-2', 'THR-3');
  CREATE TABLE "lessons_also_covers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_lessons_also_covers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_lessons_v_version_also_covers" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__lessons_v_version_also_covers",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "lessons" ADD COLUMN "competency" "enum_lessons_competency";
  ALTER TABLE "lessons" ADD COLUMN "in_core_version" boolean DEFAULT true;
  ALTER TABLE "lessons_locales" ADD COLUMN "activity" varchar;
  ALTER TABLE "_lessons_v" ADD COLUMN "version_competency" "enum__lessons_v_version_competency";
  ALTER TABLE "_lessons_v" ADD COLUMN "version_in_core_version" boolean DEFAULT true;
  ALTER TABLE "_lessons_v_locales" ADD COLUMN "version_activity" varchar;
  ALTER TABLE "lessons_also_covers" ADD CONSTRAINT "lessons_also_covers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_also_covers" ADD CONSTRAINT "_lessons_v_version_also_covers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_also_covers_order_idx" ON "lessons_also_covers" USING btree ("order");
  CREATE INDEX "lessons_also_covers_parent_idx" ON "lessons_also_covers" USING btree ("parent_id");
  CREATE INDEX "_lessons_v_version_also_covers_order_idx" ON "_lessons_v_version_also_covers" USING btree ("order");
  CREATE INDEX "_lessons_v_version_also_covers_parent_idx" ON "_lessons_v_version_also_covers" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "lessons_also_covers" CASCADE;
  DROP TABLE "_lessons_v_version_also_covers" CASCADE;
  ALTER TABLE "lessons" DROP COLUMN "competency";
  ALTER TABLE "lessons" DROP COLUMN "in_core_version";
  ALTER TABLE "lessons_locales" DROP COLUMN "activity";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_competency";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_in_core_version";
  ALTER TABLE "_lessons_v_locales" DROP COLUMN "version_activity";
  DROP TYPE "public"."enum_lessons_also_covers";
  DROP TYPE "public"."enum_lessons_competency";
  DROP TYPE "public"."enum__lessons_v_version_also_covers";
  DROP TYPE "public"."enum__lessons_v_version_competency";`)
}
