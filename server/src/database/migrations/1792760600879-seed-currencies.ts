import { type MigrationInterface, type QueryRunner } from 'typeorm';

// [code, name, kind, max_scale, iso_numeric, symbol]
const CURRENCIES: [string, string, 'Fiat' | 'Crypto', number, number | null, string | null][] = [
  ['UAH', 'Ukrainian hryvnia', 'Fiat', 2, 980, '₴'],
  ['USD', 'US dollar', 'Fiat', 2, 840, '$'],
  ['EUR', 'Euro', 'Fiat', 2, 978, '€'],
  ['GBP', 'Pound sterling', 'Fiat', 2, 826, '£'],
  ['PLN', 'Polish złoty', 'Fiat', 2, 985, 'zł'],
  ['BTC', 'Bitcoin', 'Crypto', 8, null, '₿'],
  ['ETH', 'Ether', 'Crypto', 18, null, 'Ξ'],
  ['BNB', 'BNB', 'Crypto', 18, null, null],
  ['SOL', 'Solana', 'Crypto', 9, null, null],
  ['USDT', 'Tether', 'Crypto', 8, null, '₮'],
  ['USDC', 'USD Coin', 'Crypto', 8, null, null],
];

export class SeedCurrencies1792760600879 implements MigrationInterface {
  name = 'SeedCurrencies1792760600879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [code, name, kind, maxScale, isoNumeric, symbol] of CURRENCIES) {
      await queryRunner.query(
        `INSERT INTO "currencies" ("code", "name", "kind", "max_scale", "iso_numeric", "symbol") VALUES ($1, $2, $3, $4, $5, $6)`,
        [code, name, kind, maxScale, isoNumeric, symbol],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "currencies" WHERE "code" = ANY($1)`, [
      CURRENCIES.map(([code]) => code),
    ]);
  }
}
