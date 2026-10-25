import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { TransactionEntity } from '../transaction/transaction.entity';
import { CurrencyEntity } from '../currency/currency.entity';

export enum AccountTypeEnum {
  Mono = 'Mono',
  Binance = 'Binance',
  Cash = 'Cash',
}

@Entity('accounts')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId: string;
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.accounts, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
  })
  user: UserEntity;

  @OneToMany(() => TransactionEntity, (transaction: TransactionEntity) => transaction.account)
  transactions: TransactionEntity[];

  @Column({
    name: 'name',
    type: 'text',
  })
  name: string;

  @Column({
    type: 'enum',
    enum: AccountTypeEnum,
    name: 'type',
  })
  type: AccountTypeEnum;

  @Column({
    name: 'external_id',
    type: 'text',
    comment: 'Mono black/white card, Binance USDT/BNB',
    nullable: true,
  })
  externalId: string | null;

  @Column({
    name: 'currency_code',
    type: 'varchar',
    length: 10,
  })
  currencyCode: string;
  @ManyToOne(() => CurrencyEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'currency_code',
  })
  currency: CurrencyEntity;

  @Column({
    name: 'archived_flag',
    type: 'boolean',
    default: false,
  })
  archivedFlag: boolean;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
