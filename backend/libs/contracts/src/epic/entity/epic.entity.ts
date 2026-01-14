import { EpicStatus } from '@app/contracts/enums/epic-status.enum';
import { Priority } from '@app/contracts/enums/priority.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('epics')
export class Epic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  color: string;

  @Column({
    type: 'enum',
    enum: EpicStatus,
    default: EpicStatus.TODO,
  })
  status: EpicStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    nullable: true,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({ type: 'timestamp', name: 'startDate', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'dueDate', nullable: true })
  dueDate: Date;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'team_id', nullable: true, type: 'uuid' })
  teamId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
