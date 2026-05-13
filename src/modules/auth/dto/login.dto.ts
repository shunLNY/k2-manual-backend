import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
    @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @MinLength(6)
  password: string;

  @IsOptional()
  role: string;

  @IsOptional()
  callbackUrl: string;
}
