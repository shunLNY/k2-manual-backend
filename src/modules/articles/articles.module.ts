import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { Article } from './entities/article.entity';
import { AccountEntity } from '../accounts/entities/account.entity';
import { CategoriesEntity } from '../categories/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, CategoriesEntity, AccountEntity]),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
