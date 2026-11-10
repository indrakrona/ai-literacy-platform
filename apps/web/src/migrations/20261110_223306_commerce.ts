import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_kind" AS ENUM('school_licence', 'test_voucher');
  CREATE TYPE "public"."enum_orders_method" AS ENUM('gateway', 'bank_transfer');
  CREATE TYPE "public"."enum_products_kind" AS ENUM('school_licence', 'test_voucher');
  CREATE TYPE "public"."enum_promo_codes_kinds" AS ENUM('school_licence', 'test_voucher');
  ALTER TYPE "public"."enum_orders_status" ADD VALUE 'awaiting_confirmation' BEFORE 'paid';
  ALTER TYPE "public"."enum_orders_status" ADD VALUE 'refunded';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'order_paid';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'order_transfer_reported';
  ALTER TYPE "public"."enum_notifications_kind" ADD VALUE 'order_rejected';
  CREATE TABLE "orders_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vouchers_id" integer
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"kind" "enum_products_kind" NOT NULL,
  	"price_idr" numeric NOT NULL,
  	"active" boolean DEFAULT true,
  	"min_quantity" numeric DEFAULT 1,
  	"max_quantity" numeric DEFAULT 100,
  	"months" numeric DEFAULT 12,
  	"placeholder_price" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "promo_codes_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_promo_codes_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "promo_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"percent_off" numeric,
  	"amount_off_idr" numeric,
  	"valid_until" timestamp(3) with time zone,
  	"max_uses" numeric,
  	"min_subtotal_idr" numeric,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "orders" ALTER COLUMN "school_id" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "plan" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "seats" DROP NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "kind" "enum_orders_kind" DEFAULT 'school_licence';
  ALTER TABLE "orders" ADD COLUMN "product_id" integer;
  ALTER TABLE "orders" ADD COLUMN "quantity" numeric;
  ALTER TABLE "orders" ADD COLUMN "beneficiary_id" integer;
  ALTER TABLE "orders" ADD COLUMN "months" numeric;
  ALTER TABLE "orders" ADD COLUMN "subtotal_idr" numeric;
  ALTER TABLE "orders" ADD COLUMN "discount_idr" numeric;
  ALTER TABLE "orders" ADD COLUMN "promo_id" integer;
  ALTER TABLE "orders" ADD COLUMN "ppn_idr" numeric;
  ALTER TABLE "orders" ADD COLUMN "unique_code" numeric;
  ALTER TABLE "orders" ADD COLUMN "method" "enum_orders_method" DEFAULT 'gateway';
  ALTER TABLE "orders" ADD COLUMN "transfer_note" varchar;
  ALTER TABLE "orders" ADD COLUMN "confirmed_by_id" integer;
  ALTER TABLE "orders" ADD COLUMN "fulfilled_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "refund_idr" numeric;
  ALTER TABLE "orders" ADD COLUMN "refunded_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "promo_codes_id" integer;
  ALTER TABLE "platform_settings" ADD COLUMN "bank_name" varchar;
  ALTER TABLE "platform_settings" ADD COLUMN "bank_account" varchar;
  ALTER TABLE "platform_settings" ADD COLUMN "bank_holder" varchar;
  ALTER TABLE "platform_settings" ADD COLUMN "transfer_days" numeric DEFAULT 3;
  ALTER TABLE "platform_settings" ADD COLUMN "ppn_enabled" boolean DEFAULT false;
  ALTER TABLE "platform_settings" ADD COLUMN "ppn_rate" numeric DEFAULT 11;
  ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_vouchers_fk" FOREIGN KEY ("vouchers_id") REFERENCES "public"."vouchers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promo_codes_kinds" ADD CONSTRAINT "promo_codes_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_rels_order_idx" ON "orders_rels" USING btree ("order");
  CREATE INDEX "orders_rels_parent_idx" ON "orders_rels" USING btree ("parent_id");
  CREATE INDEX "orders_rels_path_idx" ON "orders_rels" USING btree ("path");
  CREATE INDEX "orders_rels_vouchers_id_idx" ON "orders_rels" USING btree ("vouchers_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "promo_codes_kinds_order_idx" ON "promo_codes_kinds" USING btree ("order");
  CREATE INDEX "promo_codes_kinds_parent_idx" ON "promo_codes_kinds" USING btree ("parent_id");
  CREATE UNIQUE INDEX "promo_codes_code_idx" ON "promo_codes" USING btree ("code");
  CREATE INDEX "promo_codes_updated_at_idx" ON "promo_codes" USING btree ("updated_at");
  CREATE INDEX "promo_codes_created_at_idx" ON "promo_codes" USING btree ("created_at");
  ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_beneficiary_id_users_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_promo_id_promo_codes_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_confirmed_by_id_users_id_fk" FOREIGN KEY ("confirmed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promo_codes_fk" FOREIGN KEY ("promo_codes_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_product_idx" ON "orders" USING btree ("product_id");
  CREATE INDEX "orders_beneficiary_idx" ON "orders" USING btree ("beneficiary_id");
  CREATE INDEX "orders_promo_idx" ON "orders" USING btree ("promo_id");
  CREATE INDEX "orders_confirmed_by_idx" ON "orders" USING btree ("confirmed_by_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_promo_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("promo_codes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "promo_codes_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "promo_codes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders_rels" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "promo_codes_kinds" CASCADE;
  DROP TABLE "promo_codes" CASCADE;
  ALTER TABLE "orders" DROP CONSTRAINT "orders_product_id_products_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_beneficiary_id_users_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_promo_id_promo_codes_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_confirmed_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_products_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_promo_codes_fk";
  
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_orders_status";
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'paid', 'failed', 'expired');
  ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_orders_status";
  ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."enum_orders_status" USING "status"::"public"."enum_orders_status";
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE text;
  DROP TYPE "public"."enum_notifications_kind";
  CREATE TYPE "public"."enum_notifications_kind" AS ENUM('assignment_new', 'submission_received', 'project_graded', 'score_ready', 'consent_granted', 'consent_declined', 'report_received', 'pilot_request', 'badge_earned', 'announcement', 'test_reminder', 'weekly_summary', 'child_linked', 'licence_expiring', 'data_request', 'consent_withdrawn', 'content_review', 'content_decision', 'ticket_new', 'ticket_reply', 'showcase_nominated', 'showcase_published', 'peer_review');
  ALTER TABLE "notifications" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_notifications_kind" USING "kind"::"public"."enum_notifications_kind";
  DROP INDEX "orders_product_idx";
  DROP INDEX "orders_beneficiary_idx";
  DROP INDEX "orders_promo_idx";
  DROP INDEX "orders_confirmed_by_idx";
  DROP INDEX "payload_locked_documents_rels_products_id_idx";
  DROP INDEX "payload_locked_documents_rels_promo_codes_id_idx";
  ALTER TABLE "orders" ALTER COLUMN "school_id" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "plan" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "seats" SET NOT NULL;
  ALTER TABLE "orders" DROP COLUMN "kind";
  ALTER TABLE "orders" DROP COLUMN "product_id";
  ALTER TABLE "orders" DROP COLUMN "quantity";
  ALTER TABLE "orders" DROP COLUMN "beneficiary_id";
  ALTER TABLE "orders" DROP COLUMN "months";
  ALTER TABLE "orders" DROP COLUMN "subtotal_idr";
  ALTER TABLE "orders" DROP COLUMN "discount_idr";
  ALTER TABLE "orders" DROP COLUMN "promo_id";
  ALTER TABLE "orders" DROP COLUMN "ppn_idr";
  ALTER TABLE "orders" DROP COLUMN "unique_code";
  ALTER TABLE "orders" DROP COLUMN "method";
  ALTER TABLE "orders" DROP COLUMN "transfer_note";
  ALTER TABLE "orders" DROP COLUMN "confirmed_by_id";
  ALTER TABLE "orders" DROP COLUMN "fulfilled_at";
  ALTER TABLE "orders" DROP COLUMN "refund_idr";
  ALTER TABLE "orders" DROP COLUMN "refunded_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "products_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "promo_codes_id";
  ALTER TABLE "platform_settings" DROP COLUMN "bank_name";
  ALTER TABLE "platform_settings" DROP COLUMN "bank_account";
  ALTER TABLE "platform_settings" DROP COLUMN "bank_holder";
  ALTER TABLE "platform_settings" DROP COLUMN "transfer_days";
  ALTER TABLE "platform_settings" DROP COLUMN "ppn_enabled";
  ALTER TABLE "platform_settings" DROP COLUMN "ppn_rate";
  DROP TYPE "public"."enum_orders_kind";
  DROP TYPE "public"."enum_orders_method";
  DROP TYPE "public"."enum_products_kind";
  DROP TYPE "public"."enum_promo_codes_kinds";`)
}
