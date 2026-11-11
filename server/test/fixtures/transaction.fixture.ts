import { type CreateTransactionDto } from '../../src/modules/transaction/dtos/create-transaction.dto';
import { TransactionKindEnum } from '../../src/modules/transaction/transaction.entity';

type CreateTransactionBody = Partial<Record<keyof CreateTransactionDto, unknown>>;

export const buildCreateTransaction = (
  accountId: string,
  overrides?: CreateTransactionBody,
): CreateTransactionBody => ({
  accountId,
  amount: '50.00',
  kind: TransactionKindEnum.Expense,
  operationDate: '2026-11-01T10:00:00+02:00',
  ...overrides,
});
