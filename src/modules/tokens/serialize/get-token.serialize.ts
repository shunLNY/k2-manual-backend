import { Expose,  Type } from 'class-transformer';


class User {
  @Expose()
  role: string;
}

export class GetTokenSerialize {
  @Expose()
  id: string;

  @Expose()
  refreshExpire: number;


  @Expose()
  userId: string;

  @Expose({ name: 'user' })
  @Type(() => User)
  role: User;
}
