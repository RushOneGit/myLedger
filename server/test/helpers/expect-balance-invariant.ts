import { type DataSource } from 'typeorm';
import { TransactionKindEnum } from '../../src/modules/transaction/transaction.entity';

interface BalanceCheckRow {
  stored: string;
  computed: string;
  matches: boolean;
}

/**
 * Asserts the ledger invariant for one account:
 *
 *   accounts.balance == SUM(+amount for Income, −amount otherwise)
 *                       over the account's transactions WHERE deleted_at IS NULL
 *
 * The sign rule mirrors `signedAmount()` (src/common/money/signed-amount.ts);
 * if that rule changes, change it here too.
 *
 * The comparison runs in Postgres (numeric = numeric), so '100' and '100.00' are equal
 * and no amount goes through a JS number.
 */
export async function expectBalanceInvariant(
  dataSource: DataSource,
  accountId: string,
): Promise<void> {
  const rows: BalanceCheckRow[] = await dataSource.query(
    `
    SELECT s.stored::text   AS stored,
           s.computed::text AS computed,
           s.stored = s.computed AS matches
    FROM (
      SELECT a.balance AS stored,
             COALESCE(
               SUM(CASE WHEN t.kind = $2 THEN t.amount ELSE -t.amount END),
               0
             ) AS computed
      FROM accounts a
      -- deleted_at goes in the JOIN, not WHERE: in WHERE it would turn the LEFT JOIN
      -- into an inner join and an account with only deleted transactions would vanish.
      LEFT JOIN transactions t
        ON t.account_id = a.id
       AND t.deleted_at IS NULL
      WHERE a.id = $1
      GROUP BY a.id, a.balance
    ) s
    `,
    [accountId, TransactionKindEnum.Income],
  );

  const row = rows[0];
  if (!row) {
    throw new Error(`expectBalanceInvariant: account ${accountId} not found`);
  }

  expect(
    row.matches,
    `account ${accountId}: stored balance ${row.stored} != sum of transactions ${row.computed}`,
  ).toBe(true);
}
