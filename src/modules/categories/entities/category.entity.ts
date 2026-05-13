import { Article } from '../../articles/entities/article.entity';
import { StatusType } from '../../../common/constants';
import { MainEntity } from '../../../common/entity/main.entity';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('categories')
export class CategoriesEntity extends MainEntity {
  @Column({
    type: 'enum',
    enum: StatusType,
    default: StatusType.PUBLIC,
  })
  status: StatusType;

  @Column({ type: 'varchar', length: 255 })
  category_name: string;

  @Column({ type: 'varchar', length: 255 })
  category_slug: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  parent_category_id: string;

  @Column({ type: 'varchar', length: 100 })
  creator_id: string;

  @Column({ type: 'varchar', length: 100 })
  editor_id: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'int', default: 0 })
  number_of_articles_used: number;

  @OneToMany(() => Article, (article) => article.category)
  articles: Article[];

  // Parent ကို ညွှန်း
  @ManyToOne(() => CategoriesEntity, (category) => category.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory: CategoriesEntity;

  // Children တွေကို ပြန်ညွှန်း
  @OneToMany(() => CategoriesEntity, (category) => category.parentCategory)
  children: CategoriesEntity[];

  // @ManyToOne(() => AccountEntity, (account) => account.created_categories, {
  //   onDelete: 'RESTRICT',
  // })
  // @JoinColumn({ name: 'creator_id' })
  // creator: AccountEntity;
  @ManyToOne(() => AccountEntity, (account) => account.created_categories, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'creator_id' })
  creator: AccountEntity;

  @ManyToOne(() => AccountEntity, (account) => account.edited_categories, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'editor_id' })
  editor: AccountEntity;
}
