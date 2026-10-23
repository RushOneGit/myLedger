import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryEntity } from '../category/category.entity';
import { AccountEntity } from '../account/account.entity';
import { CurrencyEntity } from '../currency/currency.entity';
import { MAX_SCALE } from '../../common/money';

export enum TransactionKindEnum {
  Income = 'Income',
  Expense = 'Expense',
  Transfer = 'Transfer',
}

export enum SourceTransactionEnum {
  Manual = 'Manual',
  Mono = 'Mono',
  Binance = 'Binance',
}

@Index(['accountId', 'externalId'], { unique: true })
@Check('CHK_amount_scale_transactions', `scale("amount") <= ${String(MAX_SCALE)}`)
@Check('CHK_original_amount_scale_transactions', `scale("original_amount") <= ${String(MAX_SCALE)}`)
@Entity({ name: 'transactions' })
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'category_id',
    type: 'uuid',
    nullable: true,
  })
  categoryId: string | null;
  @ManyToOne(() => CategoryEntity, (category: CategoryEntity) => category.transactions, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'category_id',
  })
  category: CategoryEntity | null;

  @Column({
    name: 'account_id',
    type: 'uuid',
  })
  accountId: string;
  @ManyToOne(() => AccountEntity, (account: AccountEntity) => account.transactions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'account_id',
  })
  account: AccountEntity;

  // numeric without precision/scale: stored exactly as given (450, 0.99798707695).
  // Always a string — build Money from it, never Number()/parseFloat().
  @Column({
    name: 'amount',
    type: 'numeric',
    comment: 'in account currency, e.g. 45 (UAH)',
  })
  amount: string;

  @Column({
    name: 'original_amount',
    type: 'numeric',
    comment: 'in original_currency_code, e.g. 1 (USD)',
    nullable: true,
  })
  originalAmount: string | null;

  @Column({ name: 'original_currency_code', type: 'varchar', length: 10, nullable: true })
  originalCurrencyCode: string | null;
  @ManyToOne(() => CurrencyEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'original_currency_code',
  })
  originalCurrency: CurrencyEntity | null;

  @Column({
    name: 'operation_date',
    type: 'timestamptz',
    comment: 'date when operation happened',
  })
  operationDate: Date;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    name: 'category_manual',
    type: 'boolean',
    default: false,
    comment:
      'if you want to change auto-category, change it by yourself, the field will be switched to "true"',
  })
  categoryManual: boolean;

  @Column({
    name: 'mcc',
    type: 'text',
    nullable: true,
  })
  mcc: string | null;

  @Column({
    name: 'kind',
    enum: TransactionKindEnum,
    type: 'enum',
    default: TransactionKindEnum.Expense,
  })
  kind: TransactionKindEnum;

  @Column({
    name: 'transfer_pair_id',
    type: 'uuid',
    nullable: true,
  })
  transferPairId: string | null;
  @OneToOne(() => TransactionEntity, { nullable: true })
  @JoinColumn({
    name: 'transfer_pair_id',
  })
  transferPair: TransactionEntity | null;

  @Column({
    name: 'source',
    enum: SourceTransactionEnum,
    type: 'enum',
  })
  source: SourceTransactionEnum;

  @Column({
    name: 'external_id',
    type: 'text',
    nullable: true,
    comment: 'mono id, binance uuid etc.',
  })
  externalId: string | null;

  @Column({
    name: 'raw_payload',
    type: 'jsonb',
    nullable: true,
  })
  rawPayload: Record<string, unknown> | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
