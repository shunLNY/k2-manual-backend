import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CategoriesEntity } from '../../categories/entities/category.entity';
import { AccountEntity } from '../../accounts/entities/account.entity';

export enum ArticleStatus {
  PUBLISHED = 'published',
  PRIVATE = 'private'
}

@Entity('articles')
export class ArticleEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ name: 'category_id', type: 'varchar', length: 50 })
  category_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column('longtext')
  content: string;

  @Column('longtext')
  excerpt: string;

  @Column({
    name: 'thumbnail_path',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  thumbnail_path: string;

  @Column({ type: 'enum', enum: ['public', 'private'], default: 'public' })
  status: string;

  @Column({ name: 'published_start_at', type: 'datetime' })
  published_start_at: Date;

  @Column({ name: 'published_end_at', type: 'datetime', nullable: true })
  published_end_at: Date;

  // --- Creator ---
  @Column({ name: 'creator_id', type: 'varchar', length: 50 })
  creator_id: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'creator_id', referencedColumnName: 'id' })
  creator: AccountEntity;

  // --- Editor ---
  @Column({ name: 'editor_id', type: 'varchar', length: 50 })
  editor_id: string;

  @ManyToOne(() => AccountEntity)
  @JoinColumn({ name: 'editor_id', referencedColumnName: 'id' })
  editor: AccountEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date;

  // --- Category Relation ---
  @ManyToOne(() => CategoriesEntity, (category) => category.articles)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: CategoriesEntity;
}
