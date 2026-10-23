import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AccountEntity } from '../account/account.entity';
import { CategoryEntity } from '../category/category.entity';

@Entity('users')
@Unique('UQ_email_user', ['email'])
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => AccountEntity, (account: AccountEntity) => account.user)
  accounts: AccountEntity[];

  @OneToMany(() => CategoryEntity, (category: CategoryEntity) => category.owner)
  categories: CategoryEntity[];

  @Column({
    name: 'email',
  })
  email: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
