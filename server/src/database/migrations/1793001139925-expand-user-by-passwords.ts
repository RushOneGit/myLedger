import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class ExpandUserByPasswords1793001139925 implements MigrationInterface {
  name = 'ExpandUserByPasswords1793001139925';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "refresh_token" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refresh_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
  }
}
