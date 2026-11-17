import { type Money } from '../../common/money';
import { type AccountEntity } from '../../modules/account/account.entity';
import { type CreateTransactionDto } from '../../modules/transaction/dtos/create-transaction.dto';
import { type UpdateManualTransactionDto } from '../../modules/transaction/dtos/update-manual-transaction.dto';
import { type TransactionEntity } from '../../modules/transaction/transaction.entity';

export abstract class UnitOfWorkAbstractRepository {
  abstract createManual(
    amount: Money,
    delta: Money,
    account: AccountEntity,
    dto: CreateTransactionDto,
  ): Promise<TransactionEntity>;

  abstract updateManual(
    entity: TransactionEntity,
    accountId: string,
    dto: UpdateManualTransactionDto,
    newAmount: Money,
    delta: Money,
  ): Promise<TransactionEntity>;

  /**
   * Soft-deletes the transaction and reverts its effect on the balance, atomically.
   * Returns false if the row was already deleted (nothing changed).
   */
  abstract deleteManual(id: string, accountId: string, delta: Money): Promise<boolean>;
}
