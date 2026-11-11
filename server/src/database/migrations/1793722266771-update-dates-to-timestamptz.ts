import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class UpdateDatesToTimestamptz1793722266771 implements MigrationInterface {
  name = 'UpdateDatesToTimestamptz1793722266771';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "currencies" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "currencies" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "currencies" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "currencies" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "transactions"."amount" IS 'in account currency, e.g. 45 (UAH) (converted by the Bank after originalAmount)'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "transactions"."operation_date" IS 'date when operation happened'`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "transactions"."operation_date" IS NULL`);
    await queryRunner.query(
      `COMMENT ON COLUMN "transactions"."amount" IS 'in account currency, e.g. 45 (UAH)'`,
    );
    await queryRunner.query(`ALTER TABLE "currencies" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "currencies" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "currencies" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "currencies" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }
}
