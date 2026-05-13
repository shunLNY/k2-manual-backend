import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class PaginateAccountDto {
  @IsOptional()
  page: number;

  @IsOptional()
  keyword: string;

  @IsOptional()
  @IsString()
  account_id: string;

  @IsOptional()
  isEditor: boolean;

  @IsOptional()
  isAdmin: boolean;

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
