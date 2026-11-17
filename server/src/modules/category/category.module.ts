import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './category.entity';
import { CategoryService } from './category.service';
import { CategoryAbstractRepository } from './category.abstract.repository';
import { TypeOrmCategoryRepository } from './typeorm-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  providers: [
    CategoryService,
    { provide: CategoryAbstractRepository, useClass: TypeOrmCategoryRepository },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
