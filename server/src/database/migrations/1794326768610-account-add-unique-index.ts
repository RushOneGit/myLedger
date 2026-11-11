import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AccountAddUniqueIndex1794326768610 implements MigrationInterface {
  name = 'AccountAddUniqueIndex1794326768610';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_accounts_user_id_name" ON "accounts"  ("user_id", "name") WHERE "archived_flag" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_accounts_user_id_name"`);
  }
}
