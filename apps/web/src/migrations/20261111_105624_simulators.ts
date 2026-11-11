import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_lessons_simulator" ADD VALUE 'ai-or-human';
  ALTER TYPE "public"."enum_lessons_simulator" ADD VALUE 'hallucination-hunt';
  ALTER TYPE "public"."enum_lessons_simulator" ADD VALUE 'prompt-battle';
  ALTER TYPE "public"."enum_lessons_simulator" ADD VALUE 'bias-fix';
  ALTER TYPE "public"."enum_lessons_simulator" ADD VALUE 'feed-bubble';
  ALTER TYPE "public"."enum__lessons_v_version_simulator" ADD VALUE 'ai-or-human';
  ALTER TYPE "public"."enum__lessons_v_version_simulator" ADD VALUE 'hallucination-hunt';
  ALTER TYPE "public"."enum__lessons_v_version_simulator" ADD VALUE 'prompt-battle';
  ALTER TYPE "public"."enum__lessons_v_version_simulator" ADD VALUE 'bias-fix';
  ALTER TYPE "public"."enum__lessons_v_version_simulator" ADD VALUE 'feed-bubble';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lessons" ALTER COLUMN "simulator" SET DATA TYPE text;
  DROP TYPE "public"."enum_lessons_simulator";
  CREATE TYPE "public"."enum_lessons_simulator" AS ENUM('shield-sort', 'program-vs-ai', 'data-trainer', 'fair-data', 'prompt-builder');
  ALTER TABLE "lessons" ALTER COLUMN "simulator" SET DATA TYPE "public"."enum_lessons_simulator" USING "simulator"::"public"."enum_lessons_simulator";
  ALTER TABLE "_lessons_v" ALTER COLUMN "version_simulator" SET DATA TYPE text;
  DROP TYPE "public"."enum__lessons_v_version_simulator";
  CREATE TYPE "public"."enum__lessons_v_version_simulator" AS ENUM('shield-sort', 'program-vs-ai', 'data-trainer', 'fair-data', 'prompt-builder');
  ALTER TABLE "_lessons_v" ALTER COLUMN "version_simulator" SET DATA TYPE "public"."enum__lessons_v_version_simulator" USING "version_simulator"::"public"."enum__lessons_v_version_simulator";`)
}
