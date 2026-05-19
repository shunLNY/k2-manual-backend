import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PaginateArticleDto } from './dto/paginate-article.dto';
import { PaginateArticleResponse } from './serialize/paginate.serializer';
import { AuthGuard } from '@nestjs/passport';
import { BaseController } from 'src/common/controller/base.controller';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { AccountEntity } from '../accounts/entities/account.entity';
import { DuplicateArticlesDto } from './dto/duplicate-article.dto';
import { AdminPaginateArticlesSerialize } from './serialize/admin-paginate.serialize';
import { Serialize } from 'src/common/interceptor/serialize.interceptor';

@Controller('/admin/articles')
@UseGuards(AuthGuard('jwt'))
export class ArticlesController extends BaseController {
  constructor(private readonly articlesService: ArticlesService) {
    super();
  }

  @Post()
  async create(
    @AuthUser() user: AccountEntity,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    const data = await this.articlesService.create(createArticleDto, user);
    return this.response(data);
  }

  @Post('/duplicate')
  duplicateArticles(
    @AuthUser() user: AccountEntity,
    @Body() duplicateArticlesDto: DuplicateArticlesDto,
  ) {
    return this.articlesService.duplicate(duplicateArticlesDto, user);
  }

  @Get()
  async findAll(
    @Query() query: PaginateArticleDto,
  ): Promise<PaginateArticleResponse> {
    return this.articlesService.findAll(query);
  }

  @Get('paginate')
  @Serialize(AdminPaginateArticlesSerialize)
  async paginateBlogs(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: PaginateArticleDto,
  ) {
    const { items, meta } = await this.articlesService.paginateBlogs(query);
    return this.paginateResponse(items, meta);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  update(
    @AuthUser() user: AccountEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto, user);
  }

  @Delete(':id')
  remove(
    @AuthUser() user: AccountEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.articlesService.remove(id, user);
  }
}
