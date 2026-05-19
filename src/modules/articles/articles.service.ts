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
import { plainToInstance } from 'class-transformer';
import { PaginateArticleResponse } from './serialize/paginate.serializer';
import { ArticleEntity, ArticleStatus } from './entities/article.entity';
import { AccountEntity, AccountRole } from '../accounts/entities/account.entity';
import { FileService } from 'src/common/service/file.service';
import { DuplicateArticlesDto } from './dto/duplicate-article.dto';
import { PaginateArticleDto } from './dto/paginate-article.dto';
import dayjs from 'dayjs';
import { CategoriesEntity } from '../categories/entities/category.entity';
import { StatusType } from 'src/common/constants';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ArticleEntity)
    @InjectRepository(CategoriesEntity)
    private readonly categoryRepo: Repository<CategoriesEntity>,
    private readonly articlesRepo: Repository<ArticleEntity>,
    @Inject(FileService) private readonly fileService: FileService,
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
  ) { }

  async create(createArticleDto: CreateArticleDto, user: AccountEntity) {
    const { category_id, ...articlesData } = createArticleDto;
    // createArticleDto.content
    let processedContent = createArticleDto.content;
    if (processedContent) {
      processedContent = await this.processContentImages(processedContent);
    }

    if (!user || !user.id) {
      throw new BadRequestException(
        'Creator user is required to create a blog',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const image = articlesData.thumbnail_path;
      if (image?.startsWith('/storage/_tmp/images')) {
        const newImagePath = this.generatePartImageSliderPath(image);
        articlesData.thumbnail_path = newImagePath;
        try {
          this.fileService.moveFile(image, newImagePath);
        } catch (err) {
          console.log(err, '...........move image error ');
        }
      }

      const excerpt = this.generateExcerpt(createArticleDto.content || '');
      const articles = this.articlesRepo.create({
        ...articlesData,
        content: processedContent,
        excerpt: this.generateExcerpt(processedContent || ''),
        creator_id: user.id,
        editor_id: user.id,
      });

      (articles as any).categories = undefined;
      (articles as any).articlesCategories = undefined;

      if ((articles as any).id) {
        delete (articles as any).id;
      }

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
    const duplicatedBlogs: ArticleEntity[] = [];
    const failedIds: { id: string; reason: string }[] = [];

    for (const id of ids) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const originalArticles = await this.articlesRepo.findOne({
          where: { id },
          // relations: ['blog_categories', 'blog_categories.category'],
        });

        if (!originalArticles) {
          failedIds.push({ id, reason: '記事が見つかりませんでした。' });
          await queryRunner.commitTransaction();
          continue;
        }

        const newArticlesData = {
          title: `${originalArticles.title} - コピー`,
          content: originalArticles.content,
          thumbnail_path: originalArticles.thumbnail_path,
          status: ArticleStatus.PRIVATE,
          published_start_at: null,
          published_end_at: null,
          creator_id: user.id,
          editor_id: user.id,
        };

        const newArticles = this.articlesRepo.create(newArticlesData);
        const savedArticles = await queryRunner.manager.save(newArticles);

        await queryRunner.commitTransaction();
        const completeNewArticles = await this.findOne(savedArticles.id);
        duplicatedBlogs.push(completeNewArticles);

      } catch (err) {
        console.error('GET /articles でエラーが発生しました', err);
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        failedIds.push({ id, reason: err.message });
      } finally {
        await queryRunner.release();
      }
    }

    return { duplicatedBlogs, failedIds };
  }

  async findAll() {
    return this.articlesRepo.find({
      relations: ['creator', 'editor', 'categories.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async paginateBlogs(query: PaginateArticleDto) {
    const {
      page, limit, keyword, category_id,
      published_start_at, published_end_at,
      creator_name, editor_name,
      isPublished, isPrivate
    } = query;
    const queryBuilder = this.articlesRepo.createQueryBuilder('article')
      .leftJoinAndSelect('article.creator', 'creator')
      .leftJoinAndSelect('article.editor', 'editor')
      .orderBy('article.created_at', 'DESC')

    if (keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('article.title LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('article.content LIKE :keyword', { keyword: `%${keyword}%` });
      }));
    }

    if (category_id && category_id.length > 0) {
      queryBuilder.andWhere('category.id IN (:...category_id)', { category_id });
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
      statusConditions.push('(article.status = :publicStatus AND (article.publish_start_at <= NOW() OR article.publish_start_at IS NULL))');
      params['publicStatus'] = 'published';
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
      const categories = article.blog_categories ? article.blog_categories.map(articleCategory => ({
        id: articleCategory.category?.id,
        category_name: articleCategory.category?.category_name,
      })).filter(cat => cat.id) : [];

      delete article.blog_categories;

      return {
        ...article,
        published_start_at: dayjs(article.published_start_at || article.created_at).format('YYYY-MM-DD'),
        published_end_at: dayjs(article.published_end_at || article.created_at).format('YYYY-MM-DD'),
        created_at: dayjs(article.created_at).format('YYYY-MM-DD'),
        categories: categories,
      };
    });

    return {
      ...paginatedResult,
      items,
    } as Pagination
  }

  async p_findAll() {
    const now = new Date();
    const excludedBlogIds = await this.getExcludedBlogIds();

    const qb = this.articlesRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.blog_categories', 'blog_categories')
      .leftJoinAndSelect('blog_categories.category', 'category', 'category.deletedAt IS NULL')
      .where('(article.publish_start_at IS NULL OR article.publish_start_at <= :now)', { now })
      .andWhere('(article.publish_end_at IS NULL OR article.publish_end_at >= :now)', { now })
      .andWhere('blog.status = :status', { status: 'published' });

    if (excludedBlogIds.length > 0) {
      qb.andWhere('blog.id NOT IN (:...excludedBlogIds)', { excludedBlogIds });
    }
  }

  private async getExcludedBlogIds(): Promise<string[]> {
    const excludedCategories = await this.categoryRepo
      .createQueryBuilder('category')
      .select('category.id', 'id')
      .where('category.status = :status', { status: StatusType.PRIVATE })
      .orWhere('category.deletedAt IS NOT NULL')
      .withDeleted()
      .getRawMany();

    if (excludedCategories.length === 0) {
      return [];
    }
    const excludedCategoryIds = excludedCategories.map(c => c.id);

    const blogsToExclude = await this.articlesRepo
      .createQueryBuilder('article')
      .select('DISTINCT article.id', 'id')
      .innerJoin('article.blog_categories', 'bc')
      .where('bc.category_id IN (:...excludedCategoryIds)', { excludedCategoryIds })
      .getRawMany();

    const excludedBlogIds = blogsToExclude.map(b => b.id);

    return excludedBlogIds;
  }

  async p_paginateBlogs(query: PaginateArticleDto) {
    const now = new Date();
    const excludedBlogIds = await this.getExcludedBlogIds();

    const qb = this.articlesRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category', 'category.deletedAt IS NULL')
      .where('(article.publish_start_at IS NULL OR article.publish_start_at <= :now)', { now })
      .andWhere('(article.publish_end_at IS NULL OR article.publish_end_at >= :now)', { now })
      .andWhere('article.status = :status', { status: 'published' });

    if (excludedBlogIds.length > 0) {
      qb.andWhere('article.id NOT IN (:...excludedBlogIds)', { excludedBlogIds });
    }

    qb.addSelect('ISNULL(blog.publish_start_at)', 'publish_date_is_null')
      .orderBy('publish_date_is_null', 'ASC')
      .addOrderBy('blog.publish_start_at', 'DESC');

    const { page, limit } = query;

    const paginatedResult = await paginate(qb, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    const items = paginatedResult.items.map(blog => {
      const categories = blog.blog_categories
        ? blog.blog_categories.map(bc => bc.category).filter(cat => cat)
        : [];

      return {
        id: blog.id,
        title: blog.title,
        content: blog.content,
        published_at: dayjs(blog.publish_start_at || blog.createdAt).format('YYYY-MM-DD'),
        blog_categories: categories.map(cat => ({
          id: cat.id,
          category_name: cat.category_name,
          category_slug: cat.category_slug,
        })),
        excerpt: blog.excerpt || null,
        thumbnail_path: blog.thumbnail_path || null,
        publish_start_at: blog.publish_start_at || null,
        publish_end_at: blog.publish_end_at || null,
      };
    });

    return {
      items: items,
      meta: paginatedResult.meta,
    };
  }

  // Pagination & Filter
  // async findAll(query: PaginateArticleDto): Promise<PaginateArticleResponse> {
  //   const { search, status, page = 1, limit = 10 } = query;
  //   const skip = (page - 1) * limit;

  //   const queryBuilder = this.articleRepository.createQueryBuilder('article');

  //   // Relationship
  //   queryBuilder
  //     .leftJoinAndSelect('article.category', 'category')
  //     .leftJoinAndSelect('article.creator', 'creator')
  //     .leftJoinAndSelect('article.editor', 'editor');

  //   // Filter Logic
  //   if (status) {
  //     queryBuilder.andWhere('article.status = :status', { status });
  //   }

  //   if (search) {
  //     queryBuilder.andWhere(
  //       '(article.title LIKE :search OR article.content LIKE :search)',
  //       { search: `%${search}%` },
  //     );
  //   }

  //   // Pagination & Sorting
  //   queryBuilder
  //     .orderBy('article.publishedStartAt', 'DESC')
  //     .skip(skip)
  //     .take(limit);

  //   const [items, total] = await queryBuilder.getManyAndCount();

  //   // Serializer သို့ ပြောင်းလဲခြင်း
  //   return plainToInstance(
  //     PaginateArticleResponse,
  //     {
  //       data: items,
  //       meta: {
  //         totalItems: total,
  //         itemCount: items.length,
  //         itemsPerPage: limit,
  //         totalPages: Math.ceil(total / limit),
  //         currentPage: page,
  //       },
  //     },
  //     { excludeExtraneousValues: true },
  //   );
  // }

  async findOne(id: string): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'creator', 'editor'],
    });
    if (!article)
      throw new NotFoundException(`Article with ID ${id} not found`);
    return article;
  }

  async update(id: string, updateArticleDto: UpdateArticleDto, user: AccountEntity) {
    const { category_id, ...articleData } = updateArticleDto;
    console.log(category_id, articleData);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldBlog = await this.findOne(id);

      const existedThumbnail = await this.articlesRepo.findOne({ where: { id: id } })

      const image = articleData.thumbnail_path;

      if (image?.startsWith('/storage/_tmp/images')) {
        if (existedThumbnail && existedThumbnail.thumbnail_path) {
          this.fileService.delete(existedThumbnail.thumbnail_path);
        }

        const newImagePath = this.generatePartImageSliderPath(image);
        articleData.thumbnail_path = newImagePath;
        try {
          this.fileService.moveFile(image, newImagePath);
        } catch (err) {
          console.log(err, '...........move image error ');
        }
      }

      //Delete the existing thumbnail of item from local storage path
      // existedThumbnail && this.fileService.delete(existedThumbnail.thumbnail_path);
      // const image = blogData.thumbnail_path;
      // if (image?.startsWith('/storage/_tmp/images')) {
      //   const newImagePath = this.generatePartImageSliderPath(image);
      //   blogData.thumbnail_path = newImagePath;
      //   try {
      //     this.fileService.moveFile(image, newImagePath);
      //   } catch (err) {
      //     console.log(err, '...........move image error ');
      //   }
      // }

      const updatedBlogData = { ...articleData, editor_id: user.id };
      if (updateArticleDto.content) {
        const newContent = await this.processContentImages(updateArticleDto.content);
        await this.deleteUnusedImages(oldBlog.content, newContent);
        updatedBlogData.content = newContent;
        updatedBlogData.excerpt = this.generateExcerpt(newContent);
      }
      await queryRunner.manager.update(ArticleEntity, id, updatedBlogData);

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
      this.fileService.delete(articleToDelete.thumbnail_path);
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

  //Generate Image Slider Path
  private generatePartImageSliderPath(oldPath: string) {
    const extensionName = oldPath.split('.')[1];
    return (
      '/storage/blogs/thumbnail-image/' +
      this.fileService.generateFilePrefix('P_') +
      '.' +
      extensionName
    );
  }

  private extractImagePaths(htmlContent: string): string[] {
    if (!htmlContent) return [];
    const imgTagRegex = /<img[^>]+src="([^">]+)"/g;
    const paths = [];
    let match;
    while ((match = imgTagRegex.exec(htmlContent)) !== null) {
      paths.push(match[1]);
    }
    return paths;
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
        // 新しい名前を作成
        const newFileName = `articles_content_${Date.now()}.${extension}`;
        const newPath = `/storage/articles/content_images/${newFileName}`;

        try {
          // file location　変更
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
          if (oldPath.startsWith('/storage/')) {
            this.fileService.delete(oldPath);
          }
        } catch (error) {
          console.error(`Error in deleting image: ${oldPath}`, error);
        }
      }
    }
  }
}
