import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CategoryAbstractRepository } from './category.abstract.repository';
import { CategoryEntity } from './category.entity';

@Injectable()
export class TypeOrmCategoryRepository extends CategoryAbstractRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {
    super();
  }

  findOneVisible(userId: string, id: string): Promise<CategoryEntity | null> {
    return this.categoryRepository.findOneBy([
      { id, ownerId: userId },
      { id, ownerId: IsNull() },
    ]);
  }
}
