import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CategoriesEntity } from './entities/category.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return { data: category };
  }

  @Get('active')
  async findActiveCategories() {
    const categories = await this.categoriesService.findActiveCategories();
    return { data: categories };
  }

  @Get('roots')
  async findRoots() {
    const categories = await this.categoriesService.findRoots();
    return { data: categories };
  }

  @Get()
  async findAll(@Query() query: FilterCategoryDto): Promise<{ data: CategoriesEntity[] }> {
    const categories = await this.categoriesService.findAll(query);
    return { data: categories };
  }


  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);
    return { data: category };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return { data: category };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Post('reorder')
  async reorder(@Body('ids') ids: string[]) {
    await this.categoriesService.reorder(ids);
    return { success: true };
  }


}

