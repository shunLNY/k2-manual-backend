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
  Req,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PaginateArticleDto } from './dto/paginate-article.dto';
import { AuthGuard } from '@nestjs/passport';
import { BaseController } from '../../common/controller/base.controller';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AccountEntity } from '../accounts/entities/account.entity';
import { DuplicateArticlesDto } from './dto/duplicate-article.dto';
import { AdminPaginateArticlesSerialize } from './serialize/admin-paginate.serialize';
import { Serialize } from '../../common/interceptor/serialize.interceptor';

@Controller('admin/articles')
@UseGuards(AuthGuard('jwt'))
export class ArticlesController extends BaseController {
  constructor(private readonly articlesService: ArticlesService) {
    super();
  }

  @Get()
  async findAll() {
    const data = await this.articlesService.findAll();
    return this.response(data);
  }

  @Get('paginate')
  @Serialize(AdminPaginateArticlesSerialize)
  async paginateArticles(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: PaginateArticleDto,
  ) {
    const { items, meta } = await this.articlesService.paginateArticles(query);
    return this.paginateResponse(items, meta);
  }

  @Post()
  async create(
    @AuthUser() user: AccountEntity,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    const data = await this.articlesService.create(createArticleDto, user);
    return this.response(data);
  }

  @Post('duplicate')
  duplicateArticles(
    @AuthUser() user: AccountEntity,
    @Body() duplicateArticlesDto: DuplicateArticlesDto,
  ) {
    return this.articlesService.duplicate(duplicateArticlesDto, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @AuthUser() user: AccountEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(
    @AuthUser() user: AccountEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.articlesService.remove(id, user);
  }
}
