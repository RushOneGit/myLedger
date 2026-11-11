import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, QueryFailedError, Repository } from 'typeorm';
import { AccountEntity, AccountTypeEnum } from './account.entity';
import { CreateAccountDto } from './dtos/create-account.dto';
import { QueryAccountDto } from './dtos/query-account.dto';
import { FindAllEntities } from '../../common/interfaces';
import { OrderEnum } from '../../common/enums';
import { CurrencyRegistry } from '../currency/currency.registry';
import { UpdateNameAccountDto } from './dtos/update-name-account.dto';

const PG_UNIQUE_VIOLATION = '23505';
const UQ_ACCOUNT_NAME = 'UQ_accounts_user_id_name';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    private readonly currencyRegistry: CurrencyRegistry,
  ) {}

  async create(userId: string, dto: CreateAccountDto): Promise<AccountEntity> {
    const isCurrencyCodeReal = this.currencyRegistry.has(dto.currencyCode);

    if (!isCurrencyCodeReal) {
      throw new BadRequestException('Unknown currency');
    }

    const account = this.accountRepository.create({
      name: dto.name,
      type: AccountTypeEnum.Cash,
      currencyCode: dto.currencyCode,
      userId,
    });
    return await this.saveUniqueName(account);
  }

  async findAll(userId: string, query: QueryAccountDto): Promise<FindAllEntities<AccountEntity>> {
    const where = {
      userId,
      ...(query.name ? { name: ILike(`%${query.name}%`) } : {}),
      ...(query.type ? { type: query.type } : {}),
      archivedFlag: query.archivedFlag, // DTO defaults to false: active accounts unless asked
    };
    const opt: FindManyOptions<AccountEntity> = {
      where,
      order: {
        ...(query.sort
          ? Object.fromEntries(
              query.sort.map((name: string) => name.split(':') as [string, OrderEnum]),
            )
          : { createdAt: 'DESC' }),
        id: 'ASC',
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    };
    const [data, count] = await this.accountRepository.findAndCount(opt);
    return { data, count };
  }

  async findOne(userId: string, id: string): Promise<AccountEntity> {
    const findOne = await this.accountRepository.findOneBy({
      userId,
      id,
    });
    if (!findOne) throw new NotFoundException('Account not found');
    if (findOne.archivedFlag) throw new NotFoundException('Account is archived');
    return findOne;
  }

  async updateName(userId: string, id: string, dto: UpdateNameAccountDto): Promise<AccountEntity> {
    const find = await this.findOne(userId, id);
    const create = this.accountRepository.merge(find, dto);
    return this.saveUniqueName(create);
  }

  async delete(userId: string, id: string): Promise<AccountEntity> {
    const find = await this.findOne(userId, id);
    const newEntity = this.accountRepository.merge(find, { archivedFlag: true });
    return this.accountRepository.save(newEntity);
  }

  /**
   * The partial unique index UQ_accounts_user_id_name (active accounts only) is the
   * single source of truth for name uniqueness. A check-then-insert would race, and
   * would have to repeat the index's WHERE clause; catching the violation does neither.
   */
  private async saveUniqueName(account: AccountEntity): Promise<AccountEntity> {
    try {
      return await this.accountRepository.save(account);
    } catch (error) {
      const pg =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string; constraint?: string })
          : undefined;
      if (pg?.code === PG_UNIQUE_VIOLATION && pg.constraint === UQ_ACCOUNT_NAME) {
        throw new ConflictException('Account with this name already exists');
      }
      throw error;
    }
  }
}
