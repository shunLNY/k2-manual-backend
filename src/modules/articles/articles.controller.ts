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
import { BaseController } from 'src/common/controller/base.controller';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { AccountEntity } from '../accounts/entities/account.entity';
import { DuplicateArticlesDto } from './dto/duplicate-article.dto';
import { AdminPaginateArticlesSerialize } from './serialize/admin-paginate.serialize';
import { Serialize } from 'src/common/interceptor/serialize.interceptor';

@Controller('articles')
export class ArticlesController extends BaseController {
  constructor(private readonly articlesService: ArticlesService) {
    super();
  }

  // =======================================================
  // PUBLIC ROUTES (Client)
  // =======================================================

  @Post('seed')
  async seedArticles(@Query('count') count: string, @Req() req: any) {
    const articleCount = Number(count) || 50;
    const user = req.user || null;

    return await this.articlesService.seedMockArticles(articleCount, user);
  }

  @Get()
  async findAllArticles() {
    return await this.articlesService.findAll();
  }

  @Get('/')
  async findPublicAll() {
    const data = await this.articlesService.findPublicArticles();
    return this.response(data);
  }

  @Get(':id')
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOne(id);
  }

  // =======================================================
  // ADMIN ROUTES (Dashboard)
  // =======================================================

  @Get('/admin/articles')
  @UseGuards(AuthGuard('jwt'))
  async findAll() {
    const data = await this.articlesService.findAll();
    return this.response(data);
  }

  @Get('/admin/articles/paginate')
  @UseGuards(AuthGuard('jwt'))
  @Serialize(AdminPaginateArticlesSerialize)
  async paginateArticles(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: PaginateArticleDto,
  ) {
    const { items, meta } = await this.articlesService.paginateArticles(query);
    return this.paginateResponse(items, meta);
  }

  @Get('/admin/articles/:id')
  @UseGuards(AuthGuard('jwt'))
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOne(id);
  }

  @Post('/admin/articles')
  @UseGuards(AuthGuard('jwt'))
  async create(
    @AuthUser() user: AccountEntity,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    const data = await this.articlesService.create(createArticleDto, user);
    return this.response(data);
  }

  @Post('/admin/articles/duplicate')
  @UseGuards(AuthGuard('jwt'))
  duplicateArticles(
    @AuthUser() user: AccountEntity,
    @Body() duplicateArticlesDto: DuplicateArticlesDto,
  ) {
    return this.articlesService.duplicate(duplicateArticlesDto, user);
  }

  @Patch('/admin/articles/:id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @AuthUser() user: AccountEntity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto, user);
  }

  @Delete('/admin/articles/:id')
  @UseGuards(AuthGuard('jwt'))
  remove(
    @AuthUser() user: AccountEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.articlesService.remove(id, user);
  }
}
