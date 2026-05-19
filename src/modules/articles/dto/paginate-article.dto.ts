import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class PaginateArticleDto {
  @IsOptional()
  page: number;

  @IsOptional()
  keyword: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  published_start_at?: string;

  @IsOptional()
  @IsString()
  published_end_at?: string;

  @IsOptional()
  @IsString()
  creator_name?: string;

  @IsOptional()
  @IsString()
  editor_name?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  limit: number;

  @IsOptional()
  sortBy: string | undefined;

  @IsOptional()
  @Transform(({ value }) => {
    const order = value ? value.toUpperCase() : undefined;
    if (order === 'ASC' || order === 'DESC') return order;
    return undefined;
  })
  orderBy: 'ASC' | 'DESC' | undefined;
}
