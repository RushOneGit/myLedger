import { Injectable } from '@nestjs/common';
import { AccountAbstractRepository } from './account.abstract.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, ILike, Repository } from 'typeorm';
import { AccountEntity } from './account.entity';
import { QueryAccountDto } from './dtos/query-account.dto';
import { OrderEnum } from '../../common/enums';

@Injectable()
export class TypeOrmAccountRepository extends AccountAbstractRepository {
  constructor(
    @InjectRepository(AccountEntity) private readonly accountRepository: Repository<AccountEntity>,
  ) {
    super();
  }

  async findAll(
    userId: string,
    query: QueryAccountDto,
  ): Promise<[data: AccountEntity[], count: number]> {
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
    return this.accountRepository.findAndCount(opt);
  }

  async findOne(userId: string, id: string): Promise<AccountEntity | null> {
    return this.accountRepository.findOneBy({
      userId,
      id,
    });
  }

  async create(data: Partial<AccountEntity>): Promise<AccountEntity> {
    const entity = this.accountRepository.create(data);
    return this.accountRepository.save(entity);
  }

  async update(entity: AccountEntity, data: Partial<AccountEntity>): Promise<AccountEntity> {
    const merged = this.accountRepository.merge(entity, data);
    return this.accountRepository.save(merged);
  }

  existsActiveByName(userId: string, name: string): Promise<boolean> {
    return this.accountRepository.existsBy({ userId, name, archivedFlag: false });
  }
}
