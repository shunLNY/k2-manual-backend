import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
} from 'class-validator';

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
  thumbnailPath: string;

  @IsEnum(['public', 'private'])
  status: 'public' | 'private';

  @IsNotEmpty()
  publishedStartAt: Date;

  @IsOptional()
  publishedEndAt?: Date;

  @IsNotEmpty()
  @IsUUID()
  creatorId: string;

  @IsOptional()
  @IsUUID()
  editorId?: string;
}
