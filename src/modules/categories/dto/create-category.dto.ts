import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { StatusType } from "src/common/constants";

export class CreateCategoryDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  category_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  category_slug: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  parent_category_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  creator_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  editor_id: string;

  @IsEnum(StatusType)
  status: StatusType;

  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @IsNumber()
  @IsOptional()
  number_of_articles_used?: number;
}


