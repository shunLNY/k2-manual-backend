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

@Controller('articles')
export class PublicArticlesController extends BaseController {
  constructor(private readonly articlesService: ArticlesService) {
    super();
  }

  @Post('seed')
  async seedArticles(@Query('count') count: string, @Req() req: any) {
    const articleCount = Number(count) || 50;
    const user = req.user || null;

    return await this.articlesService.seedMockArticles(articleCount, user);
  }

  @Get()
  async findPublicAll() {
    const data = await this.articlesService.findPublicArticles();
    return this.response(data);
  }

  @Get(':id')
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOne(id);
  }
}
