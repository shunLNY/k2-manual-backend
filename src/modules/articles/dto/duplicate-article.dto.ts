import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class DuplicateArticlesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
