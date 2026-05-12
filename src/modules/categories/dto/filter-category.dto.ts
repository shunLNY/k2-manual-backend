import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterCategoryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  parent_category_id?: string;

  @IsOptional()
  @IsString()
  status?: string;


  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
  creator_name?: string;

  @IsOptional()
  @IsString()
  editor_name?: string;
}