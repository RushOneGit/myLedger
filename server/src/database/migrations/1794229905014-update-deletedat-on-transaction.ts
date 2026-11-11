import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class UpdateDeletedatOnTransaction1794229905014 implements MigrationInterface {
  name = 'UpdateDeletedatOnTransaction1794229905014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD "deleted_at" TIMESTAMP`);
  }
}
