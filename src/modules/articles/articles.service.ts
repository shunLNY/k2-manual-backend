import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { generateId, paginate, Pagination } from 'src/common/service/helper.service';
import { ArticleEntity } from './entities/article.entity';
import { AccountEntity, AccountRole } from '../accounts/entities/account.entity';
import { FileService } from 'src/common/service/file.service';
import { DuplicateArticlesDto } from './dto/duplicate-article.dto';
import { PaginateArticleDto } from './dto/paginate-article.dto';
import * as dayjs from 'dayjs';
import { CategoriesEntity } from '../categories/entities/category.entity';

@Injectable()
export class ArticlesService {
  private readonly articleRepository: Repository<ArticleEntity>;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CategoriesEntity)
    private readonly categoryRepo: Repository<CategoriesEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articlesRepo: Repository<ArticleEntity>,
    @Inject(FileService) private readonly fileService: FileService,
  ) {
    this.articleRepository = this.articlesRepo;
  }

  async create(createArticleDto: CreateArticleDto, user: AccountEntity) {
    const rawDto = createArticleDto as any;
    const category_id = rawDto.category_id || (rawDto.categoryIds && rawDto.categoryIds[0]);
    const publishStartAt = rawDto.publish_start_at || rawDto.published_start_at || rawDto.publishStartAt || rawDto.publishedStartAt;
    const publishEndAt = rawDto.publish_end_at || rawDto.published_end_at || rawDto.publishEndAt || rawDto.publishedEndAt;

    let processedContent = createArticleDto.content;
    if (processedContent) {
      processedContent = await this.processContentImages(processedContent);
    }

    if (!user || !user.id) {
      throw new BadRequestException('Creator user is required to create an article');
    }

    let dbStatus = createArticleDto.status as string;
    if (dbStatus === 'published') {
      dbStatus = 'public';
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const thumbnailPath = createArticleDto.thumbnail_path;
      let finalThumbnailPath = thumbnailPath;
      if (thumbnailPath?.startsWith('/storage/_tmp/images')) {
        finalThumbnailPath = this.generatePartImageSliderPath(thumbnailPath);
        try {
          this.fileService.moveFile(thumbnailPath, finalThumbnailPath);
        } catch (err) {
          console.log(err, '...........move image error ');
        }
      }

      const summaryText =
        createArticleDto.description ??
        createArticleDto.excerpt ??
        this.generateExcerpt(processedContent || '');

      const articles = this.articlesRepo.create({
        id: generateId(),
        title: createArticleDto.title,
        status: dbStatus,
        content: processedContent,
        description: summaryText,
        excerpt: summaryText,
        thumbnail_path: finalThumbnailPath,
        published_start_at: publishStartAt ? new Date(publishStartAt) : new Date(),
        published_end_at: publishEndAt ? new Date(publishEndAt) : null,
        category_id: category_id,
        creator_id: user.id,
        editor_id: user.id,
      });

      const savedArticles = await queryRunner.manager.save(articles);

      await queryRunner.commitTransaction();
      return this.findOne(savedArticles.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async duplicate(duplicateArticlesDto: DuplicateArticlesDto, user: AccountEntity) {
    const { ids } = duplicateArticlesDto;
    const duplicatedArticles: ArticleEntity[] = [];
    const failedIds: { id: string; reason: string }[] = [];

    for (const id of ids) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const originalArticles = await this.articlesRepo.findOne({
          where: { id },
        });

        if (!originalArticles) {
          failedIds.push({ id, reason: '記事が見つかりませんでした。' });
          await queryRunner.commitTransaction();
          continue;
        }

        const newArticlesData = {
          id: generateId(),
          title: `${originalArticles.title} - コピー`,
          content: originalArticles.content,
          excerpt: originalArticles.excerpt,
          description: originalArticles.description ?? originalArticles.excerpt,
          thumbnail_path: originalArticles.thumbnail_path,
          status: 'private',
          published_start_at: originalArticles.published_start_at,
          published_end_at: originalArticles.published_end_at,
          category_id: originalArticles.category_id,
          creator_id: user.id,
          editor_id: user.id,
        };

        const newArticles = this.articlesRepo.create(newArticlesData);
        const savedArticles = await queryRunner.manager.save(newArticles);

        await queryRunner.commitTransaction();
        const completeNewArticles = await this.findOne(savedArticles.id);
        duplicatedArticles.push(completeNewArticles);
      } catch (err) {
        console.error('Duplicating article failed:', err);
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        failedIds.push({ id, reason: err.message });
      } finally {
        await queryRunner.release();
      }
    }

    return { duplicatedArticles, failedIds };
  }

  async findAll() {
    const list = await this.articlesRepo.find({
      relations: ['creator', 'editor', 'category'],
      order: { createdAt: 'DESC' },
    });
    return list.map(item => {
      if (item.status === 'public') {
        item.status = 'published';
      }
      return item;
    });
  }

  async paginateArticles(query: PaginateArticleDto) {
    const {
      page, limit, keyword, category_id,
      published_start_at, published_end_at,
      creator_name, editor_name,
      isPublished, isPrivate
    } = query;

    const queryBuilder = this.articlesRepo.createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.creator', 'creator')
      .leftJoinAndSelect('article.editor', 'editor')
      .orderBy('article.createdAt', 'DESC');

    if (keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('article.title LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('article.content LIKE :keyword', { keyword: `%${keyword}%` });
      }));
    }

    if (category_id) {
      const categoryIds = Array.isArray(category_id) ? category_id : [category_id];
      if (categoryIds.length > 0) {
        queryBuilder.andWhere('category.id IN (:...categoryIds)', { categoryIds });
      }
    }

    if (published_start_at) {
      queryBuilder.andWhere(
        '(article.published_end_at IS NULL OR article.published_end_at >= :published_start_at)',
        { published_start_at }
      );
    }

    if (published_end_at) {
      queryBuilder.andWhere(
        'COALESCE(article.published_start_at, article.created_at) <= :published_end_at',
        { published_end_at }
      );
    }

    if (creator_name) {
      queryBuilder.andWhere('creator.account_name LIKE :creator_name', { creator_name: `%${creator_name}%` });
    }

    if (editor_name) {
      queryBuilder.andWhere('editor.account_name LIKE :editor_name', { editor_name: `%${editor_name}%` });
    }

    const statusConditions: string[] = [];
    const params = {};

    if (isPublished) {
      statusConditions.push('(article.status = :publicStatus AND (article.published_start_at <= NOW() OR article.published_start_at IS NULL))');
      params['publicStatus'] = 'public';
    }
    if (isPrivate) {
      statusConditions.push('article.status = :privateStatus');
      params['privateStatus'] = 'private';
    }
    if (statusConditions.length > 0) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where(statusConditions.join(' OR '), params);
      }));
    }

    const paginatedResult = await paginate(queryBuilder, { page: Number(page) || 1, limit: Number(limit) || 10 });

    const items = paginatedResult.items.map(article => {
      const categories = article.category ? [{
        id: article.category.id,
        category_name: article.category.category_name,
      }] : [];

      let mappedStatus = article.status;
      if (mappedStatus === 'public') {
        mappedStatus = 'published';
      }

      return {
        ...article,
        status: mappedStatus,
        published_start_at: article.published_start_at ? dayjs(article.published_start_at).format('YYYY-MM-DD') : null,
        published_end_at: article.published_end_at ? dayjs(article.published_end_at).format('YYYY-MM-DD') : null,
        created_at: dayjs(article.createdAt).format('YYYY-MM-DD'),
        categories: categories,
      };
    });

    return {
      ...paginatedResult,
      items,
    } as Pagination;
  }

  async findOne(id: string): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'creator', 'editor'],
    });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    if (article.status === 'public') {
      article.status = 'published';
    }
    return article;
  }

  async update(id: string, updateArticleDto: UpdateArticleDto, user: AccountEntity) {
    const rawDto = updateArticleDto as any;
    const categoryId = rawDto.categoryId || rawDto.category_id || (rawDto.categoryIds && rawDto.categoryIds[0]);
    const publishStartAt = rawDto.publish_start_at || rawDto.published_start_at || rawDto.publishStartAt || rawDto.publishedStartAt;
    const publishEndAt = rawDto.publish_end_at || rawDto.published_end_at || rawDto.publishEndAt || rawDto.publishedEndAt;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldArticle = await this.findOne(id);
      const thumbnailPath = updateArticleDto.thumbnail_path;
      let finalThumbnailPath = thumbnailPath;

      if (thumbnailPath?.startsWith('/storage/_tmp/images')) {
        if (oldArticle && oldArticle.thumbnail_path) {
          try {
            this.fileService.delete(oldArticle.thumbnail_path);
          } catch (err) {
            console.log('Error deleting old thumbnail:', err);
          }
        }

        finalThumbnailPath = this.generatePartImageSliderPath(thumbnailPath);
        try {
          this.fileService.moveFile(thumbnailPath, finalThumbnailPath);
        } catch (err) {
          console.log(err, '...........move image error ');
        }
      }

      let dbStatus = updateArticleDto.status as string;
      if (dbStatus === 'published') {
        dbStatus = 'public';
      }

      const updatedArticleData: any = {
        title: updateArticleDto.title,
        status: dbStatus,
        thumbnail_path: finalThumbnailPath,
        category_id: categoryId,
        editor_id: user.id,
      };

      if (publishStartAt !== undefined) {
        updatedArticleData.published_start_at = publishStartAt ? new Date(publishStartAt) : null;
      }
      if (publishEndAt !== undefined) {
        updatedArticleData.published_end_at = publishEndAt ? new Date(publishEndAt) : null;
      }

      if (updateArticleDto.description !== undefined) {
        updatedArticleData.description = updateArticleDto.description;
        updatedArticleData.excerpt = updateArticleDto.description;
      } else if (updateArticleDto.excerpt !== undefined) {
        updatedArticleData.description = updateArticleDto.excerpt;
        updatedArticleData.excerpt = updateArticleDto.excerpt;
      }

      if (updateArticleDto.content) {
        const newContent = await this.processContentImages(updateArticleDto.content);
        await this.deleteUnusedImages(oldArticle.content, newContent);
        updatedArticleData.content = newContent;
        if (updateArticleDto.description === undefined && updateArticleDto.excerpt === undefined) {
          const autoExcerpt = this.generateExcerpt(newContent);
          updatedArticleData.excerpt = autoExcerpt;
          updatedArticleData.description = autoExcerpt;
        }
      }

      await queryRunner.manager.update(ArticleEntity, id, updatedArticleData);

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string, user: AccountEntity) {
    if (user.role !== AccountRole.ADMIN) {
      throw new ForbiddenException('この記事を削除する権限がありません。');
    }

    const articleToDelete = await this.findOne(id);
    await this.deleteUnusedImages(articleToDelete.content, '');

    if (articleToDelete.thumbnail_path) {
      try {
        this.fileService.delete(articleToDelete.thumbnail_path);
      } catch (err) {
        console.log('Error deleting thumbnail file on removal:', err);
      }
    }

    const result = await this.articlesRepo.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ID "${id}" のブログが見つかりませんでした。`);
    }

    return { message: `ID "${id}" の記事が正常に削除されました。` };
  }

  private generateExcerpt(htmlContent: string, length = 120): string {
    if (!htmlContent) {
      return '';
    }
    const replacedImg = htmlContent.replace(/<img[^>]*>/g, ' [画像] ');
    const plainText = replacedImg.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ');
    return plainText.substring(0, length);
  }

  private generatePartImageSliderPath(oldPath: string) {
    const extensionName = oldPath.split('.').pop();
    return (
      '/storage/articles/thumbnail_images/' +
      this.fileService.generateFilePrefix('P_') +
      '.' +
      extensionName
    );
  }

  private extractImagePaths(htmlContent: string): string[] {
    if (!htmlContent) return [];
    const imgTagRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const paths: string[] = [];
    let match;
    while ((match = imgTagRegex.exec(htmlContent)) !== null) {
      paths.push(this.normalizeImagePath(match[1]));
    }
    return paths;
  }

  private normalizeImagePath(src: string): string {
    if (!src) return src;
    if (src.includes('/files/storage/')) {
      return src.substring(src.indexOf('/storage/'));
    }
    if (src.includes('/files/image/storage/')) {
      return src.substring(src.indexOf('/storage/'));
    }
    const storageIndex = src.indexOf('/storage/');
    if (storageIndex >= 0) {
      return src.substring(storageIndex);
    }
    return src;
  }

  private async processContentImages(content: string): Promise<string> {
    if (!content) return content;
    let updatedContent = content;
    const currentPaths = this.extractImagePaths(content);

    for (const imagePath of currentPaths) {
      if (imagePath.includes('/storage/_tmp')) {
        const relativeSrcPath = imagePath.includes('http')
          ? imagePath.substring(imagePath.indexOf('/storage/'))
          : imagePath;

        const extension = relativeSrcPath.split('.').pop();
        const newFileName = `articles_content_${Date.now()}.${extension}`;
        const newPath = `/storage/articles/content_images/${newFileName}`;

        try {
          this.fileService.moveFile(relativeSrcPath, newPath);
          updatedContent = updatedContent.split(imagePath).join(newPath);
        } catch (err) {
          console.error(`Error in moving image: ${imagePath}`, err);
        }
      }
    }
    return updatedContent;
  }

  private async deleteUnusedImages(
    oldContent: string,
    newContent: string = '',
  ): Promise<void> {
    const oldPaths = this.extractImagePaths(oldContent);
    const newPaths = this.extractImagePaths(newContent);

    for (const oldPath of oldPaths) {
      if (!newPaths.includes(oldPath)) {
        try {
          const storagePath = this.normalizeImagePath(oldPath);
          if (storagePath.startsWith('/storage/')) {
            this.fileService.delete(storagePath);
          }
        } catch (error) {
          console.error(`Error in deleting image: ${oldPath}`, error);
        }
      }
    }
  }
}
