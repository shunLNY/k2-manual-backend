import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  create(createArticleDto: CreateArticleDto) {
    const newArticle = this.articleRepository.create(createArticleDto);
    return this.articleRepository.save(newArticle);
  }

  findAll() {
    return this.articleRepository.find(); // Deleted ဖြစ်ထားတာတွေကို auto ချန်ပေးပါလိမ့်မယ် (Soft Delete)
  }

  findOne(id: string) {
    return this.articleRepository.findOneBy({ id });
  }

  async update(id: string, updateArticleDto: UpdateArticleDto) {
    await this.articleRepository.update(id, updateArticleDto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.articleRepository.softDelete(id); // Migration မှာ deleted_at ပါလို့ softDelete သုံးတာ ပိုကောင်းပါတယ်
  }
}
