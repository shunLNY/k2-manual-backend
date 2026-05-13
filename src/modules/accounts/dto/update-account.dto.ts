import { PartialType } from "@nestjs/mapped-types";
import { CreateAccountDto } from "./create-account.dto";
import { IsOptional } from "class-validator";

export class UpdateAccountDto extends PartialType(CreateAccountDto) { 
  @IsOptional()
  isEmailEdited : boolean;
}