import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CategoryEntity } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async findOne(userId: string, id: string): Promise<CategoryEntity> {
    const findOne = await this.categoryRepository.findOneBy([
      { id, ownerId: userId },
      { id, ownerId: IsNull() },
    ]);
    if (!findOne) throw new NotFoundException('Category not found');
    if (findOne.archivedFlag) throw new NotFoundException('Category is archived');
    return findOne;
  }
}
