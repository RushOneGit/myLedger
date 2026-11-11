import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DataSource,
  Equal,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  IsNull,
  Or,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SourceTransactionEnum, TransactionEntity } from './transaction.entity';
import { FindAllEntities } from '../../common/interfaces';
import { QueryTransactionDto } from './dtos/query-transaction.dto';
import { OrderEnum } from '../../common/enums';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { AccountService } from '../account/account.service';
import { AccountEntity, AccountTypeEnum } from '../account/account.entity';
import { UpdateManualTransactionDto } from './dtos/update-manual-transaction.dto';
import { UpdateCategoryTransactionDto } from './dtos/update-category-transaction.dto';
import { CategoryService } from '../category/category.service';
import { CurrencyRegistry } from '../currency/currency.registry';
import { signedAmount } from '../../common/money/signed-amount';
import { dateRange } from '../../common/query/date-range';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    private readonly accountService: AccountService,
    private readonly categoryService: CategoryService,
    private readonly currencyRegistry: CurrencyRegistry,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<FindAllEntities<TransactionEntity>> {
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

    const [data, count] = await this.transactionRepository.findAndCount({
      where,
      order,
      relations: { category: true },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { data, count };
  }

  async findOne(userId: string, id: string): Promise<TransactionEntity> {
    const entity = await this.transactionRepository.findOneBy({
      id,
      account: { userId },
    });
    if (!entity) throw new NotFoundException(`Transaction not found`);
    return entity;
  }

  async createCash(userId: string, dto: CreateTransactionDto): Promise<TransactionEntity> {
    const account = await this.accountService.findOne(userId, dto.accountId);
    if (account.type !== AccountTypeEnum.Cash) {
      throw new NotFoundException(`Cash account not found`);
    }

    if (dto.categoryId) {
      await this.categoryService.findOne(userId, dto.categoryId);
    }

    const amount = this.currencyRegistry.money(dto.amount, account.currencyCode);
    const delta = signedAmount(dto.kind, amount);

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

  async updateManual(
    userId: string,
    id: string,
    dto: UpdateManualTransactionDto,
  ): Promise<TransactionEntity> {
    const entity = await this.transactionRepository.findOneBy({
      id,
      account: { userId },
      source: SourceTransactionEnum.Manual,
    });
    if (!entity)
      throw new NotFoundException(
        `Transaction with id: ${id} not found or the source of operation is not Manual`,
      );

    const account = await this.accountService.findOne(userId, entity.accountId);

    if (dto.categoryId) {
      await this.categoryService.findOne(userId, dto.categoryId);
    }

    const oldEffect = signedAmount(
      entity.kind,
      this.currencyRegistry.money(entity.amount, account.currencyCode),
    );

    const newAmount = this.currencyRegistry.money(dto.amount, account.currencyCode);
    const newEffect = signedAmount(dto.kind, newAmount);

    const delta = newEffect.subtract(oldEffect);

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
        await manager.increment(AccountEntity, { id: account.id }, 'balance', delta.toString());
      }

      return save;
    });
  }

  async updateCategory(
    userId: string,
    id: string,
    dto: UpdateCategoryTransactionDto,
  ): Promise<TransactionEntity> {
    const entity = await this.transactionRepository.findOneBy({
      id,
      account: { userId },
      source: In([SourceTransactionEnum.Mono, SourceTransactionEnum.Binance]),
    });
    if (!entity) throw new NotFoundException(`Transaction with id: ${id} not found`);

    if (dto.categoryId) {
      await this.categoryService.findOne(userId, dto.categoryId); // 404 if it belongs to someone else or is archived
    }

    const newEntity = this.transactionRepository.merge(entity, {
      categoryId: dto.categoryId ?? null,
      categoryManual: true,
    });
    return this.transactionRepository.save(newEntity);
  }

  async deleteManual(userId: string, id: string): Promise<void> {
    const entity = await this.transactionRepository.findOneBy({
      id,
      account: { userId },
      source: SourceTransactionEnum.Manual,
    });
    if (!entity) throw new NotFoundException(`Transaction with id: ${id} not found`);

    const account = await this.accountService.findOne(userId, entity.accountId);

    const amount = this.currencyRegistry.money(entity.amount, account.currencyCode);
    const delta = signedAmount(entity.kind, amount);

    return this.dataSource.transaction(async (manager) => {
      const result = await manager.softDelete(TransactionEntity, { id, deletedAt: IsNull() });
      if (!result.affected) throw new NotFoundException(`Transaction with id: ${id} is not found`);

      await manager.decrement(AccountEntity, { id: account.id }, 'balance', delta.toString());
    });
  }
}
