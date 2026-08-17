import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
  ParseUUIDPipe,
  ParseArrayPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { CategoriesEntity } from './entities/category.entity';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AccountEntity } from '../accounts/entities/account.entity';
import { BaseController } from '../../common/controller/base.controller';

@Controller('admin/categories')
@UseGuards(AuthGuard('jwt'))
export class CategoriesController extends BaseController {
  constructor(private readonly categoriesService: CategoriesService) {
    super();
  }

  @Post()
  async create(
    @AuthUser() user: AccountEntity,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const data = await this.categoriesService.create(createCategoryDto, user);
    return this.response(data);
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
  async findAll(
    @Query() query: FilterCategoryDto,
  ): Promise<{ data: CategoriesEntity[] }> {
    const categories = await this.categoriesService.findAll(query);
    return { data: categories };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.categoriesService.findOne(id);
    return this.response(data);
  }

  @Put(':id')
  async update(
    @AuthUser() user: AccountEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(
      id,
      updateCategoryDto,
      user,
    );
    return this.response(category);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.remove(id);
    return this.response(undefined, {
      title: 'Success',
      body: 'Category deleted successfully',
    });
  }

  @Post('reorder')
  async reorder(
    @Body('ids', ParseArrayPipe) ids: string[],
    @AuthUser() user: AccountEntity,
  ) {
    await this.categoriesService.reorder(ids, user);
    return this.response({ message: ' Order Updated' });
  }
}
