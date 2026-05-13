import { Column, Entity, OneToMany } from 'typeorm';
// import { BlogEntity } from '../blogs/blog.entity';
import { MainEntity } from '../../../common/entity/main.entity';
import { CategoriesEntity } from "../../categories/entities/category.entity";
import TokenEntity from '../../tokens/entities/token.entity';
// import { CategoriesEntity } from '../categories/categories.entity';
// import TokenEntity from '../tokens/tokens.entity';

// import { CategoriesEntity } from '../categories/categories.entity';

// アカウントの役割を定義
export enum AccountRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
}

@Entity({ name: 'accounts' })
export class AccountEntity extends MainEntity {
  @Column({ length: 100 })
  account_name: string;

  @Column({
    type: 'enum',
    enum: AccountRole,
  })
  role: AccountRole;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255, })
  password: string;

  @Column({ length: 50, nullable : true   })
  account_id: string;

  @Column({ type : "varchar" , length: 255, unique: true, nullable: true })
  reset_password_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reset_password_expires: Date | null;

  @OneToMany(() => CategoriesEntity, (category) => category.creator)
  created_categories: CategoriesEntity[];

  @OneToMany(() => CategoriesEntity, (category) => category.editor)
  edited_categories: CategoriesEntity[];

  // @OneToMany(() => BlogEntity, (blog) => blog.creator)
  // created_blogs: BlogEntity[];

  // @OneToMany(() => BlogEntity, (blog) => blog.editor)
  // edited_blogs: BlogEntity[];

  // //login logout tokens
  @OneToMany(() => TokenEntity, (token) => token.user)
  tokens: TokenEntity[];
}
