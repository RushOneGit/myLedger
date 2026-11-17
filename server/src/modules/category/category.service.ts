import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryEntity } from './category.entity';
import { CategoryAbstractRepository } from './category.abstract.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryAbstractRepository) {}

  async findOne(userId: string, id: string): Promise<CategoryEntity> {
    const findOne = await this.categoryRepository.findOneVisible(userId, id);
    if (!findOne) throw new NotFoundException('Category not found');
    if (findOne.archivedFlag) throw new NotFoundException('Category is archived');
    return findOne;
  }
}
