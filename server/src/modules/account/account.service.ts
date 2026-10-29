import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from './account.entity';
import { CreateAccountDto } from './dtos/create-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async create(userId: string, dto: CreateAccountDto): Promise<AccountEntity> {
    const exists = await this.accountRepository.findOneBy({ name: dto.name });
    if (exists) {
      throw new ConflictException('Account with this name already exists');
    }
    const account = this.accountRepository.create({
      name: dto.name,
      type: dto.type,
      currencyCode: dto.currencyCode,
      archivedFlag: dto.archivedFlag,
      userId,
    });
    return this.accountRepository.save(account);
  }
}
