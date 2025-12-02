import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, Index, JoinColumn } from 'typeorm';
import { Task } from './task.entity';

@Entity('task_labels')
@Index(['taskId', 'labelId'], { unique: true })
export class TaskLabel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) 
  name: string; 

  @Column({ nullable: true })
  color: string; 

  @Column({ type: 'uuid',nullable: true })
  projectId: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  @Index()
  labelId: string;

  @ManyToOne(() => Task, (task) => task.taskLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}