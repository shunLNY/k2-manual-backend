import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesEntity } from './entities/category.entity';
import { PublicCategoriesController } from './public-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriesEntity])],
  controllers: [CategoriesController, PublicCategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
