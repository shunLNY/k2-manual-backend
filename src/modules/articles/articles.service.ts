import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { generateId } from 'src/common/service/helper.service';
import { plainToInstance } from 'class-transformer';
import { PaginateArticleResponse } from './serialize/paginate.serializer';
import { PaginateArticleDto } from './dto/paginate-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async create(createArticleDto: CreateArticleDto) {
    const newArticle = this.articleRepository.create({
      ...createArticleDto,
      id: generateId(),
    });

    return await this.articleRepository.save(newArticle);
  }

  // Pagination & Filter ပါဝင်သော findAll
  async findAll(query: PaginateArticleDto): Promise<PaginateArticleResponse> {
    const { search, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.articleRepository.createQueryBuilder('article');

    // Relationship များကို ချိတ်ဆက်ခြင်း
    queryBuilder
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.creator', 'creator')
      .leftJoinAndSelect('article.editor', 'editor');

    // Filter Logic
    if (status) {
      queryBuilder.andWhere('article.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(article.title LIKE :search OR article.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Pagination & Sorting
    queryBuilder
      .orderBy('article.publishedStartAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    // Serializer သို့ ပြောင်းလဲခြင်း
    return plainToInstance(
      PaginateArticleResponse,
      {
        data: items,
        meta: {
          totalItems: total,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      },
      { excludeExtraneousValues: true },
    );
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
