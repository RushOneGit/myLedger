import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateBaseEntities1792760590982 implements MigrationInterface {
  name = 'CreateBaseEntities1792760590982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_email_user" UNIQUE ("email"), CONSTRAINT "PK_users" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."currencies_kind_enum" AS ENUM('Fiat', 'Crypto')`,
    );
    await queryRunner.query(
      `CREATE TABLE "currencies" ("code" character varying(10) NOT NULL, "name" text NOT NULL, "kind" "public"."currencies_kind_enum" NOT NULL, "max_scale" smallint NOT NULL, "iso_numeric" smallint, "symbol" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_iso_numeric_currencies" UNIQUE ("iso_numeric"), CONSTRAINT "CHK_max_scale_currencies" CHECK ("max_scale" BETWEEN 0 AND 18), CONSTRAINT "PK_currencies" PRIMARY KEY ("code")); COMMENT ON COLUMN "currencies"."code" IS 'UAH, USD, BTC, USDT'; COMMENT ON COLUMN "currencies"."max_scale" IS 'max digits after the decimal point: UAH 2, BTC 8'; COMMENT ON COLUMN "currencies"."iso_numeric" IS 'ISO 4217 numeric code, used by Mono (980 = UAH); null for crypto'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."accounts_type_enum" AS ENUM('Mono', 'Binance', 'Cash')`,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" text NOT NULL, "type" "public"."accounts_type_enum" NOT NULL, "external_id" text, "currency_code" character varying(10) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "archived_flag" boolean NOT NULL DEFAULT false, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_accounts" PRIMARY KEY ("id")); COMMENT ON COLUMN "accounts"."external_id" IS 'Mono black/white card, Binance USDT/BNB'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_kind_enum" AS ENUM('Income', 'Expense', 'Transfer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_source_enum" AS ENUM('Manual', 'Mono', 'Binance')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category_id" uuid, "account_id" uuid NOT NULL, "amount" numeric NOT NULL, "original_amount" numeric, "original_currency_code" character varying(10), "operation_date" TIMESTAMP WITH TIME ZONE NOT NULL, "description" text, "category_manual" boolean NOT NULL DEFAULT false, "mcc" text, "kind" "public"."transactions_kind_enum" NOT NULL DEFAULT 'Expense', "transfer_pair_id" uuid, "source" "public"."transactions_source_enum" NOT NULL, "external_id" text, "raw_payload" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_transfer_pair_id_transactions" UNIQUE ("transfer_pair_id"), CONSTRAINT "CHK_original_amount_scale_transactions" CHECK (scale("original_amount") <= 18), CONSTRAINT "CHK_amount_scale_transactions" CHECK (scale("amount") <= 18), CONSTRAINT "PK_transactions" PRIMARY KEY ("id")); COMMENT ON COLUMN "transactions"."amount" IS 'in account currency, e.g. 45 (UAH)'; COMMENT ON COLUMN "transactions"."original_amount" IS 'in original_currency_code, e.g. 1 (USD)'; COMMENT ON COLUMN "transactions"."operation_date" IS 'date when operation happened'; COMMENT ON COLUMN "transactions"."category_manual" IS 'if you want to change auto-category, change it by yourself, the field will be switched to "true"'; COMMENT ON COLUMN "transactions"."external_id" IS 'mono id, binance uuid etc.'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_account_id_external_id_transactions" ON "transactions"  ("account_id", "external_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."categories_kind_enum" AS ENUM('Expense', 'Income')`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid, "name" text NOT NULL, "kind" "public"."categories_kind_enum" NOT NULL DEFAULT 'Expense', "archived_flag" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_categories" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_user_id_accounts" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_currency_code_accounts" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_category_id_transactions" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_account_id_transactions" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_original_currency_code_transactions" FOREIGN KEY ("original_currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transfer_pair_id_transactions" FOREIGN KEY ("transfer_pair_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_owner_id_categories" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_owner_id_categories"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_transfer_pair_id_transactions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_original_currency_code_transactions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_account_id_transactions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_category_id_transactions"`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_currency_code_accounts"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_user_id_accounts"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TYPE "public"."categories_kind_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_account_id_external_id_transactions"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_kind_enum"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_type_enum"`);
    await queryRunner.query(`DROP TABLE "currencies"`);
    await queryRunner.query(`DROP TYPE "public"."currencies_kind_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
