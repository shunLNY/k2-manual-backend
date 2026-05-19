import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ArticleStatus } from '../entities/article.entity';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string; // Summer Note content

  @IsNotEmpty()
  @IsString()
  excerpt: string; // '概要' (Summary/Description)

  @IsNotEmpty()
  @IsString()
  thumbnail_path: string;

  @IsEnum(ArticleStatus)
  @IsNotEmpty()
  status: ArticleStatus;

  @IsOptional()
  @IsDateString()
  published_start_at?: Date | null;

  @IsOptional()
  @IsDateString()
  published_end_at?: Date | null;
}
