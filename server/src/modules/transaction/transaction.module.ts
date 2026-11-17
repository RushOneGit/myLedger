import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './transaction.entity';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { AccountModule } from '../account/account.module';
import { CategoryModule } from '../category/category.module';
import { CurrencyModule } from '../currency/currency.module';
import { TransactionAbstractRepository } from './transaction.abstract.repository';
import { TypeOrmTransactionAbstractRepository } from './typeorm-transaction.repository';
import { TypeOrmUnitOfWorkAbstractRepository } from '../../shared/unit-of-work/typeorm-unit-of-work.repository';
import { UnitOfWorkAbstractRepository } from '../../shared/unit-of-work/unit-of-work.abstract.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
    AccountModule,
    CategoryModule,
    CurrencyModule,
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    { provide: TransactionAbstractRepository, useClass: TypeOrmTransactionAbstractRepository },
    { provide: UnitOfWorkAbstractRepository, useClass: TypeOrmUnitOfWorkAbstractRepository },
  ],
})
export class TransactionModule {}
