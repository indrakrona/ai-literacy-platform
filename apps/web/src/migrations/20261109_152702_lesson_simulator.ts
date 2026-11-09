import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lessons_simulator" AS ENUM('shield-sort', 'program-vs-ai', 'data-trainer', 'fair-data', 'prompt-builder');
  CREATE TYPE "public"."enum__lessons_v_version_simulator" AS ENUM('shield-sort', 'program-vs-ai', 'data-trainer', 'fair-data', 'prompt-builder');
  ALTER TABLE "lessons" ADD COLUMN "simulator" "enum_lessons_simulator";
  ALTER TABLE "_lessons_v" ADD COLUMN "version_simulator" "enum__lessons_v_version_simulator";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lessons" DROP COLUMN "simulator";
  ALTER TABLE "_lessons_v" DROP COLUMN "version_simulator";
  DROP TYPE "public"."enum_lessons_simulator";
  DROP TYPE "public"."enum__lessons_v_version_simulator";`)
}
