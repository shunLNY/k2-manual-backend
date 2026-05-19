import { AccountEntity } from '../../accounts/entities/account.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';



@Entity({ name: 'tokens' })
export default class TokenEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  refreshToken: string;

  @Column({
    type: 'timestamp',
  })
  refreshExpire: Date;

  @Column()
  userAgent: string;

@Column({ type: 'varchar', nullable: true }) // Added nullable: true
deviceType?: string;

  @Column()
  ipAddress: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => AccountEntity, (user) => user.tokens, {
    onDelete: 'CASCADE',
  })
  user: AccountEntity;

}
