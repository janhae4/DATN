import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MemberDto } from '../dto/member.dto';

export enum TeamStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DISBANDED = 'disbanded',
}

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  ownerId: string;

  @Column('jsonb', { default: [] })
  members: MemberDto[];

  @Column({
    type: 'enum',
    enum: TeamStatus,
    default: TeamStatus.ARCHIVED,
  })
  status: TeamStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
