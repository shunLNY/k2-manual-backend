import { Expose } from "class-transformer";

export class GetOneAccountByIdSerialize {
  @Expose()
  id : string;

  @Expose()
  account_name: string;

  @Expose()
  email: string;

  @Expose()
  role: string;

}