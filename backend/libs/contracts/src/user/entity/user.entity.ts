import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Follow } from './follow.entity';
import { Role } from '@app/contracts/enums';
import { UserSkill } from '@app/contracts';



@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  @Index()
  phone: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({default: false})
  isBan: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'text', nullable: true, select: false })
  verifiedCode: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  expiredCode: Date | null;

  @Column({ type: 'text', nullable: true, select: false })
  resetCode: string | null;

  @Column({type: 'text', nullable: true, select: true})
  jobTitle: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({select: false})
  updatedAt: Date;

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => UserSkill, (skill) => skill.user)
  skills: UserSkill[]
}
