import { type CategoryEntity } from './category.entity';

export abstract class CategoryAbstractRepository {
  /** The user's own category or a system one (owner_id IS NULL). */
  abstract findOneVisible(userId: string, id: string): Promise<CategoryEntity | null>;
}
