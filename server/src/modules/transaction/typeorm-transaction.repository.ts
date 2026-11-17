import { Injectable } from '@nestjs/common';
import { TransactionAbstractRepository } from './transaction.abstract.repository';
import { QueryTransactionDto } from './dtos/query-transaction.dto';
import { Equal, FindOptionsOrder, FindOptionsWhere, In, IsNull, Or, Repository } from 'typeorm';
import { SourceTransactionEnum, TransactionEntity } from './transaction.entity';
import { dateRange } from '../../common/query/date-range';
import { OrderEnum } from '../../common/enums';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmTransactionAbstractRepository extends TransactionAbstractRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly TransactionAbstractRepository: Repository<TransactionEntity>,
  ) {
    super();
  }

  findAll(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<[data: TransactionEntity[], count: number]> {
    // Ownership: always joined through the account, whatever the other filters are.
    const where: FindOptionsWhere<TransactionEntity> = { account: { userId } };

    if (query.accountId) where.accountId = query.accountId;
    if (query.amount) where.amount = query.amount;
    if (query.kind) where.kind = query.kind;
    if (query.source) where.source = query.source;

    if (query.categoryId && query.uncategorized) {
      where.categoryId = Or(Equal(query.categoryId), IsNull());
    } else if (query.categoryId) {
      where.categoryId = query.categoryId;
    } else if (query.uncategorized) {
      where.categoryId = IsNull();
    }

    const operationDate = dateRange(query.from, query.to); // throws 400 if from >= to
    if (operationDate) where.operationDate = operationDate;

    const order: FindOptionsOrder<TransactionEntity> = query.sort
      ? Object.fromEntries(query.sort.map((item) => item.split(':') as [string, OrderEnum]))
      : { operationDate: OrderEnum.DESC };
    order.id ??= OrderEnum.ASC; // unique tiebreaker for stable pagination

    return this.TransactionAbstractRepository.findAndCount({
      where,
      order,
      relations: { category: true },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
  }

  findOne(id: string, userId: string): Promise<TransactionEntity | null> {
    return this.TransactionAbstractRepository.findOneBy({
      id,
      account: { userId },
    });
  }

  findOneManual(id: string, userId: string): Promise<TransactionEntity | null> {
    return this.TransactionAbstractRepository.findOneBy({
      id,
      account: { userId },
      source: SourceTransactionEnum.Manual,
    });
  }

  findOneSynced(id: string, userId: string): Promise<TransactionEntity | null> {
    return this.TransactionAbstractRepository.findOneBy({
      id,
      account: { userId },
      source: In([SourceTransactionEnum.Mono, SourceTransactionEnum.Binance]),
    });
  }

  update(entity: TransactionEntity, data: Partial<TransactionEntity>): Promise<TransactionEntity> {
    const merged = this.TransactionAbstractRepository.merge(entity, data);
    return this.TransactionAbstractRepository.save(merged);
  }
}
