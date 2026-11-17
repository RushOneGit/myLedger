import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionEntity } from './transaction.entity';
import { FindAllEntities } from '../../common/interfaces';
import { QueryTransactionDto } from './dtos/query-transaction.dto';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { AccountService } from '../account/account.service';
import { AccountTypeEnum } from '../account/account.entity';
import { UpdateManualTransactionDto } from './dtos/update-manual-transaction.dto';
import { UpdateCategoryTransactionDto } from './dtos/update-category-transaction.dto';
import { CategoryService } from '../category/category.service';
import { CurrencyRegistry } from '../currency/currency.registry';
import { signedAmount } from '../../common/money/signed-amount';
import { TransactionAbstractRepository } from './transaction.abstract.repository';
import { UnitOfWorkAbstractRepository } from '../../shared/unit-of-work/unit-of-work.abstract.repository';

@Injectable()
export class TransactionService {
  constructor(
    private readonly TransactionAbstractRepository: TransactionAbstractRepository,
    private readonly unitOfWork: UnitOfWorkAbstractRepository,
    private readonly accountService: AccountService,
    private readonly categoryService: CategoryService,
    private readonly currencyRegistry: CurrencyRegistry,
  ) {}

  async findAll(
    userId: string,
    query: QueryTransactionDto,
  ): Promise<FindAllEntities<TransactionEntity>> {
    const [data, count] = await this.TransactionAbstractRepository.findAll(userId, query);
    return { data, count };
  }

  async findOne(userId: string, id: string): Promise<TransactionEntity> {
    const entity = await this.TransactionAbstractRepository.findOne(id, userId);

    if (!entity) throw new NotFoundException(`Transaction not found`);
    return entity;
  }

  async createManual(userId: string, dto: CreateTransactionDto): Promise<TransactionEntity> {
    const account = await this.accountService.findOne(userId, dto.accountId);
    if (account.type !== AccountTypeEnum.Cash) {
      throw new NotFoundException(`Cash account not found`);
    }

    if (dto.categoryId) {
      await this.categoryService.findOne(userId, dto.categoryId);
    }

    const amount = this.currencyRegistry.money(dto.amount, account.currencyCode);
    const delta = signedAmount(dto.kind, amount);

    return this.unitOfWork.createManual(amount, delta, account, dto);
  }

  async updateManual(
    userId: string,
    id: string,
    dto: UpdateManualTransactionDto,
  ): Promise<TransactionEntity> {
    const entity = await this.TransactionAbstractRepository.findOneManual(id, userId);
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

    return this.unitOfWork.updateManual(entity, account.id, dto, newAmount, delta);
  }

  async updateCategory(
    userId: string,
    id: string,
    dto: UpdateCategoryTransactionDto,
  ): Promise<TransactionEntity> {
    const entity = await this.TransactionAbstractRepository.findOneSynced(id, userId);
    if (!entity) throw new NotFoundException(`Transaction with id: ${id} not found`);

    if (dto.categoryId) {
      await this.categoryService.findOne(userId, dto.categoryId); // 404 if it belongs to someone else or is archived
    }

    return this.TransactionAbstractRepository.update(entity, {
      categoryId: dto.categoryId ?? null,
      categoryManual: true,
    });
  }

  async deleteManual(userId: string, id: string): Promise<void> {
    const entity = await this.TransactionAbstractRepository.findOneManual(id, userId);
    if (!entity) throw new NotFoundException(`Transaction with id: ${id} not found`);

    const account = await this.accountService.findOne(userId, entity.accountId);

    const amount = this.currencyRegistry.money(entity.amount, account.currencyCode);
    const delta = signedAmount(entity.kind, amount);

    const deleted = await this.unitOfWork.deleteManual(id, account.id, delta);
    if (!deleted) throw new NotFoundException(`Transaction with id: ${id} is not found`);
  }
}
