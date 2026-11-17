import { Injectable } from '@nestjs/common';
import { UnitOfWorkAbstractRepository } from './unit-of-work.abstract.repository';
import { AccountEntity } from '../../modules/account/account.entity';
import {
  SourceTransactionEnum,
  TransactionEntity,
} from '../../modules/transaction/transaction.entity';
import { DataSource, IsNull } from 'typeorm';
import { Money } from '../../common/money';
import { CreateTransactionDto } from '../../modules/transaction/dtos/create-transaction.dto';
import { UpdateManualTransactionDto } from '../../modules/transaction/dtos/update-manual-transaction.dto';

@Injectable()
export class TypeOrmUnitOfWorkAbstractRepository extends UnitOfWorkAbstractRepository {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  createManual(
    amount: Money,
    delta: Money,
    account: AccountEntity,
    dto: CreateTransactionDto,
  ): Promise<TransactionEntity> {
    return this.dataSource.transaction(async (manager) => {
      const transaction = manager.create(TransactionEntity, {
        amount: amount.toString(),
        accountId: account.id,
        categoryId: dto.categoryId ?? null,
        description: dto.description,
        operationDate: new Date(dto.operationDate),
        kind: dto.kind,
        source: SourceTransactionEnum.Manual,
      });
      const saved = await manager.save(transaction);
      await manager.increment(AccountEntity, { id: account.id }, 'balance', delta.toString());
      return saved;
    });
  }

  updateManual(
    entity: TransactionEntity,
    accountId: string,
    dto: UpdateManualTransactionDto,
    newAmount: Money,
    delta: Money,
  ): Promise<TransactionEntity> {
    return this.dataSource.transaction(async (manager) => {
      const transaction = manager.merge(TransactionEntity, entity, {
        operationDate: new Date(dto.operationDate),
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        amount: newAmount.toString(),
        kind: dto.kind,
      });
      const save = await manager.save(transaction);

      if (!delta.isZero()) {
        await manager.increment(AccountEntity, { id: accountId }, 'balance', delta.toString());
      }

      return save;
    });
  }

  deleteManual(id: string, accountId: string, delta: Money): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager.softDelete(TransactionEntity, { id, deletedAt: IsNull() });
      if (!result.affected) return false; // already deleted: skip the balance update

      await manager.decrement(AccountEntity, { id: accountId }, 'balance', delta.toString());
      return true;
    });
  }
}
