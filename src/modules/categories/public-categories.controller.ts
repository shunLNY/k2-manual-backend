import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('active')
  async findActiveCategories() {
    const categories = await this.categoriesService.findActiveCategories();
    return { data: categories };
  }
}