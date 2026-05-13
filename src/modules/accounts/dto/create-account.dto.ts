import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AccountRole } from '../entities/account.entity';

export class CreateAccountDto {
  @IsString()
  account_name: string;

  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  role: AccountRole;
}
