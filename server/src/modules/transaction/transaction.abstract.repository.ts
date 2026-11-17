import { type QueryTransactionDto } from './dtos/query-transaction.dto';
import { type TransactionEntity } from './transaction.entity';

export abstract class TransactionAbstractRepository {
  abstract findAll(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<[data: TransactionEntity[], count: number]>;

  abstract findOne(id: string, userId: string): Promise<TransactionEntity | null>;

  /** Only source = MANUAL. */
  abstract findOneManual(id: string, userId: string): Promise<TransactionEntity | null>;

  /** Only synced sources (MONO, BINANCE_IMPORT). */
  abstract findOneSynced(id: string, userId: string): Promise<TransactionEntity | null>;

  /** Merges `data` into `entity` and persists it. */
  abstract update(
    entity: TransactionEntity,
    data: Partial<TransactionEntity>,
  ): Promise<TransactionEntity>;
}
