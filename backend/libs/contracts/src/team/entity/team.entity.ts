import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TeamMember } from './team-member.entity';
import { TeamStatus } from '@app/contracts';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({nullable: true})
  avatar?: string;

  @Column()
  ownerId: string;

  @OneToMany(() => TeamMember, (member) => member.team)
  members: TeamMember[];

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
