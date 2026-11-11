import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddBalanceAccount1793796337392 implements MigrationInterface {
  name = 'AddBalanceAccount1793796337392';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" ADD "balance" numeric NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "balance"`);
  }
}
