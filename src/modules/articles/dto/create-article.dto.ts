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
  category_id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string; // Summer Note content

  @IsOptional()
  @IsString()
  excerpt?: string; // '概要' (Summary/Description)

  @IsOptional()
  @IsString()
  thumbnail_path?: string;

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
