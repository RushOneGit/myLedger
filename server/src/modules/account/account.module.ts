import { Module } from '@nestjs/common';
import { AccountEntity } from './account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CurrencyModule } from '../currency/currency.module';
import { TypeOrmAccountRepository } from './typeorm-account.repository';
import { AccountAbstractRepository } from './account.abstract.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity]), CurrencyModule],
  controllers: [AccountController],
  providers: [
    AccountService,
    { provide: AccountAbstractRepository, useClass: TypeOrmAccountRepository },
  ],
  exports: [AccountService],
})
export class AccountModule {}
