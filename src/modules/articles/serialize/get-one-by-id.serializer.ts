// src/modules/articles/serialize/get-article.serializer.ts
import { Expose, Type } from 'class-transformer';

export class GetArticleSerializer {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  excerpt: string;

  @Expose()
  status: string;

  @Expose({ name: 'thumbnail_path' })
  thumbnailPath: string;

  @Expose({ name: 'published_start_at' })
  publishedStartAt: Date;

  @Expose()
  categoryId: string;

  @Expose()
  creatorId: string;
}
