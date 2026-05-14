import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { AccountEntity } from '../accounts/entities/account.entity';
import { CategoriesEntity } from '../categories/entities/category.entity';
import { ArticleEntity } from './entities/article.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleEntity, CategoriesEntity, AccountEntity]),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
