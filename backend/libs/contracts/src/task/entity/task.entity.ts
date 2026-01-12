import { Priority } from '@app/contracts/enums/priority.enum';
<<<<<<< HEAD
=======
import { ApprovalStatus } from '@app/contracts/enums/approval-status.enum';
>>>>>>> origin/blank_branch
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
import { TaskLabel } from './task-label.entity';
@Entity('tasks')
@Index(['projectId', 'createdAt'])
@Index(['projectId', 'listId', 'updatedAt'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'projectId', nullable: false })
  projectId: string;

<<<<<<< HEAD
  @Column({ type: 'uuid', name: 'teamId', nullable: true }) 
=======
  @Column({ type: 'uuid', name: 'teamId', nullable: true })
>>>>>>> origin/blank_branch
  @Index()
  teamId: string | null;

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

  @Column({ type: 'varchar', name: 'skill', nullable: true })
  skillName: string | null;

  @Column({ type: 'real', name: 'exp', nullable: true })
  exp: number | null;

  @Column('uuid', { array: true, nullable: true, default: [] })
  assigneeIds: string[];

  @Column('varchar', { array: true, nullable: true, default: [] })
  fileIds: string[];

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

<<<<<<< HEAD
=======
  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approvalStatus: ApprovalStatus;

>>>>>>> origin/blank_branch
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @OneToMany(() => TaskLabel, (taskLabel) => taskLabel.task, {
    cascade: true
  })
  taskLabels: TaskLabel[];

  @ManyToOne(() => Task, (task) => task.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Task;

  @OneToMany(() => Task, (task) => task.parent)
  children: Task[];

}
