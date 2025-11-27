import { Priority } from '@app/contracts/enums/priority.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'projectId', nullable: false })
  projectId: string;

  @Column({ type: 'uuid', name: 'listId', nullable: false })
  listId: string;

  @Column({ type: 'uuid', name: 'reporterId', nullable: true })
  reporterId: string | null;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({ type: 'timestamp', name: 'due_date', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'timestamp', name: 'start_date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'uuid', name: 'epicId', nullable: true })
  epicId: string | null;

  @Column({ type: 'uuid', name: 'sprintId', nullable: true })
  sprintId: string | null;

  @Column({ type: 'uuid', name: 'parentId', nullable: true })
  parentId: string | null;

  @Column({ type: 'real', default: 65535, nullable: false })
  position: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

}
