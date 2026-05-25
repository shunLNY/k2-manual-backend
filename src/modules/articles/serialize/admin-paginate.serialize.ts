import { Expose, Type } from 'class-transformer';
import { CategoriesEntity } from 'src/modules/categories/entities/category.entity';

export class User {
  @Expose()
  id: string;

  @Expose()
  account_name: string;
}

export class AdminPaginateArticlesSerialize {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  status: string;

  @Expose()
  published_start_at: string;

  @Expose()
  thumbnail_path: string;

  @Expose()
  published_end_at: string;

  @Expose()
  content: string;

  @Expose()
  excerpt: string;

  @Expose()
  description: string;

  @Expose()
  @Type(() => User)
  creator: User;

  @Expose()
  @Type(() => User)
  editor: User;

  @Expose()
  categories: CategoriesEntity[];

  // @Expose({ name: "categoryIds" })
  // categoryIds: string[];
}
