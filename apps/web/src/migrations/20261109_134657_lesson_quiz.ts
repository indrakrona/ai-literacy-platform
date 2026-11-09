import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "lessons_quiz_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"correct" boolean DEFAULT false
  );
  
  CREATE TABLE "lessons_quiz_options_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lessons_quiz" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "lessons_quiz_locales" (
  	"prompt" varchar,
  	"explanation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_lessons_v_version_quiz_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"correct" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lessons_v_version_quiz_options_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_lessons_v_version_quiz" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lessons_v_version_quiz_locales" (
  	"prompt" varchar,
  	"explanation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "lessons_quiz_options" ADD CONSTRAINT "lessons_quiz_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons_quiz"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_quiz_options_locales" ADD CONSTRAINT "lessons_quiz_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons_quiz_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_quiz" ADD CONSTRAINT "lessons_quiz_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_quiz_locales" ADD CONSTRAINT "lessons_quiz_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons_quiz"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_quiz_options" ADD CONSTRAINT "_lessons_v_version_quiz_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v_version_quiz"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_quiz_options_locales" ADD CONSTRAINT "_lessons_v_version_quiz_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v_version_quiz_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_quiz" ADD CONSTRAINT "_lessons_v_version_quiz_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lessons_v_version_quiz_locales" ADD CONSTRAINT "_lessons_v_version_quiz_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lessons_v_version_quiz"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "lessons_quiz_options_order_idx" ON "lessons_quiz_options" USING btree ("_order");
  CREATE INDEX "lessons_quiz_options_parent_id_idx" ON "lessons_quiz_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lessons_quiz_options_locales_locale_parent_id_unique" ON "lessons_quiz_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lessons_quiz_order_idx" ON "lessons_quiz" USING btree ("_order");
  CREATE INDEX "lessons_quiz_parent_id_idx" ON "lessons_quiz" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "lessons_quiz_locales_locale_parent_id_unique" ON "lessons_quiz_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lessons_v_version_quiz_options_order_idx" ON "_lessons_v_version_quiz_options" USING btree ("_order");
  CREATE INDEX "_lessons_v_version_quiz_options_parent_id_idx" ON "_lessons_v_version_quiz_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_lessons_v_version_quiz_options_locales_locale_parent_id_uni" ON "_lessons_v_version_quiz_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lessons_v_version_quiz_order_idx" ON "_lessons_v_version_quiz" USING btree ("_order");
  CREATE INDEX "_lessons_v_version_quiz_parent_id_idx" ON "_lessons_v_version_quiz" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_lessons_v_version_quiz_locales_locale_parent_id_unique" ON "_lessons_v_version_quiz_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "lessons_quiz_options" CASCADE;
  DROP TABLE "lessons_quiz_options_locales" CASCADE;
  DROP TABLE "lessons_quiz" CASCADE;
  DROP TABLE "lessons_quiz_locales" CASCADE;
  DROP TABLE "_lessons_v_version_quiz_options" CASCADE;
  DROP TABLE "_lessons_v_version_quiz_options_locales" CASCADE;
  DROP TABLE "_lessons_v_version_quiz" CASCADE;
  DROP TABLE "_lessons_v_version_quiz_locales" CASCADE;`)
}
