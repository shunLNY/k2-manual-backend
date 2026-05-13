import { Expose } from "class-transformer";

export class PaginateAccountSerialize {
  @Expose()
  id : string;

  @Expose()
  account_name: string;

  @Expose()
  account_id: string;

  @Expose()
  email: string;

  @Expose()
  role: string;

}