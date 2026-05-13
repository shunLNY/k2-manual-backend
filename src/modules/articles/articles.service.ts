import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { generateId } from 'src/common/service/helper.service';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  // async create(createArticleDto: CreateArticleDto): Promise<Article> {
  //   const article = this.articleRepository.create(createArticleDto);
  //   return await this.articleRepository.save(article);
  // }

  // async create(createArticleDto: CreateArticleDto) {
  //   const newArticle = this.articleRepository.create(createArticleDto);
  //   return await this.articleRepository.save(newArticle);
  // }

  async create(createArticleDto: CreateArticleDto) {
    const newArticle = this.articleRepository.create({
      ...createArticleDto,
      id: generateId(),
    });

    return await this.articleRepository.save(newArticle);
  }

  async findAll(): Promise<Article[]> {
    return await this.articleRepository.find({
      relations: {
        category: true,
        creator: true,
        editor: true,
      },
      order: { publishedStartAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'creator', 'editor'],
    });
    if (!article)
      throw new NotFoundException(`Article with ID ${id} not found`);
    return article;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.articleRepository.preload({
      id: id,
      ...updateArticleDto,
    });
    if (!article)
      throw new NotFoundException(`Article with ID ${id} not found`);
    return await this.articleRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Article not found`);
  }
}
