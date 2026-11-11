import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddDeleteatTransaction1793794810433 implements MigrationInterface {
  name = 'AddDeleteatTransaction1793794810433';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" ADD "deleted_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "deleted_at"`);
  }
}
