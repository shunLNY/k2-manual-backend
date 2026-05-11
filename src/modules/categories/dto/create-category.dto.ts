import { IsEnum, IsNotEmpty, IsNumber, IsString, MaxLength } from "class-validator";
import { StatusType } from "src/common/constants";

export class CreateCategoryDto {
  @IsNumber()
  sort_order: number;

  @IsEnum(StatusType)
  status: StatusType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category_slug: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  thumbnail_path: string;

  @IsString()
  creator_id: string;

  @IsString()
  editor_id: string;

}
