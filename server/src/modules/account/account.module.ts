import { Module } from '@nestjs/common';
import { AccountEntity } from './account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
})
export class AccountModule {}
