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

<<<<<<< HEAD
  @Column({nullable: true})
=======
  @Column({ nullable: true })
>>>>>>> origin/blank_branch
  avatar?: string;

  @Column()
  ownerId: string;

  @OneToMany(() => TeamMember, (member) => member.team)
  members: TeamMember[];

  @Column({
    type: 'enum',
    enum: TeamStatus,
<<<<<<< HEAD
    default: TeamStatus.ARCHIVED,
=======
    default: TeamStatus.ACTIVE,
>>>>>>> origin/blank_branch
  })
  status: TeamStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
