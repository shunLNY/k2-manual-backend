import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column()
  title: string;

  @Column('longtext')
  content: string;

  @Column('longtext')
  excerpt: string;

  @Column({ name: 'thumbnail_path', nullable: true })
  thumbnailPath: string;

  @Column({ type: 'enum', enum: ['public', 'private'], default: 'public' })
  status: string;

  @Column({ name: 'published_start_at' })
  publishedStartAt: Date;

  @Column({ name: 'published_end_at', nullable: true })
  publishedEndAt: Date;

  @Column({ name: 'creator_id' })
  creatorId: string;

  @Column({ name: 'editor_id' })
  editorId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
