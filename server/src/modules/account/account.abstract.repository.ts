import { type AccountEntity } from './account.entity';
import { type QueryAccountDto } from './dtos/query-account.dto';

export abstract class AccountAbstractRepository {
  abstract findAll(
    userId: string,
    query: QueryAccountDto,
  ): Promise<[data: AccountEntity[], count: number]>;
  abstract findOne(userId: string, id: string): Promise<AccountEntity | null>;
  abstract create(data: Partial<AccountEntity>): Promise<AccountEntity>;
  /** Merges `data` into `entity` and persists it. */
  abstract update(entity: AccountEntity, data: Partial<AccountEntity>): Promise<AccountEntity>;
  abstract existsActiveByName(userId: string, name: string): Promise<boolean>;
}
