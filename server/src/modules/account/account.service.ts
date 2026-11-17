import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountEntity, AccountTypeEnum } from './account.entity';
import { CreateAccountDto } from './dtos/create-account.dto';
import { QueryAccountDto } from './dtos/query-account.dto';
import { FindAllEntities } from '../../common/interfaces';
import { CurrencyRegistry } from '../currency/currency.registry';
import { UpdateNameAccountDto } from './dtos/update-name-account.dto';
import { AccountAbstractRepository } from './account.abstract.repository';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountAbstractRepository,
    private readonly currencyRegistry: CurrencyRegistry,
  ) {}

  async create(userId: string, dto: CreateAccountDto): Promise<AccountEntity> {
    const isCurrencyCodeReal = this.currencyRegistry.has(dto.currencyCode);

    if (!isCurrencyCodeReal) {
      throw new BadRequestException('Unknown currency');
    }

    await this.assertNameIsFree(userId, dto.name);

    return this.accountRepository.create({
      name: dto.name,
      type: AccountTypeEnum.Cash,
      currencyCode: dto.currencyCode,
      userId,
    });
  }

  async findAll(userId: string, query: QueryAccountDto): Promise<FindAllEntities<AccountEntity>> {
    const [data, count] = await this.accountRepository.findAll(userId, query);
    return { data, count };
  }

  async findOne(userId: string, id: string): Promise<AccountEntity> {
    const findOne = await this.accountRepository.findOne(userId, id);
    if (!findOne) throw new NotFoundException('Account not found');
    if (findOne.archivedFlag) throw new NotFoundException('Account is archived');
    return findOne;
  }

  async updateName(userId: string, id: string, dto: UpdateNameAccountDto): Promise<AccountEntity> {
    const find = await this.findOne(userId, id);
    if (dto.name !== find.name) await this.assertNameIsFree(userId, dto.name);
    return this.accountRepository.update(find, dto);
  }

  async delete(userId: string, id: string): Promise<AccountEntity> {
    const find = await this.findOne(userId, id);
    return this.accountRepository.update(find, { archivedFlag: true });
  }

  private async assertNameIsFree(userId: string, name: string): Promise<void> {
    const taken = await this.accountRepository.existsActiveByName(userId, name);
    if (taken) throw new ConflictException('Account with this name already exists');
  }
}
