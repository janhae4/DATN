import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('task_labels')
export class TaskLabel {
  @PrimaryColumn({ type: 'uuid' })
  taskId: string;

  @PrimaryColumn({ type: 'uuid' })
  labelId: string;
}
