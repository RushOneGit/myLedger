import { randomUUID } from 'crypto';
import { type CategoryEntity, CategoryKindEnum } from '../../src/modules/category/category.entity';
import { userId } from './user.fixture';

export const categoryData = {
  id: randomUUID(),
  ownerId: userId,
  name: `category-${randomUUID()}`,
  kind: CategoryKindEnum.Expense,
  archivedFlag: false,
} as CategoryEntity;
