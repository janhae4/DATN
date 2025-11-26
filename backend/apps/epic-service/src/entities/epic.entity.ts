import { EpicStatus, Priority } from '@app/contracts';
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

  @Column({ type: 'timestamp', name: 'start_date', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', name: 'due_date', nullable: true })
  dueDate: Date;

  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
