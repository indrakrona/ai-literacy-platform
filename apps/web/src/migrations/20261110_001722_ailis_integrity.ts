import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "test_attempts" ADD COLUMN "option_order" jsonb;
  ALTER TABLE "test_attempts" ADD COLUMN "incidents" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "test_attempts" DROP COLUMN "option_order";
  ALTER TABLE "test_attempts" DROP COLUMN "incidents";`)
}
