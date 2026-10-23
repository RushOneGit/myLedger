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
import { TransactionEntity } from '../transaction/transaction.entity';
import { UserEntity } from '../user/user.entity';

export enum CategoryKindEnum {
  Expense = 'Expense',
  Income = 'Income',
}

@Entity({ name: 'categories' })
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'owner_id',
    type: 'uuid',
    nullable: true,
  })
  ownerId: string | null;
  @ManyToOne(() => UserEntity, (user: UserEntity) => user.categories, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'owner_id',
  })
  owner: UserEntity | null;

  @Column({
    name: 'name',
    type: 'text',
  })
  name: string;

  @OneToMany(() => TransactionEntity, (transaction: TransactionEntity) => transaction.category)
  transactions: TransactionEntity[];

  @Column({
    name: 'kind',
    enum: CategoryKindEnum,
    type: 'enum',
    default: CategoryKindEnum.Expense,
  })
  kind: CategoryKindEnum;

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
