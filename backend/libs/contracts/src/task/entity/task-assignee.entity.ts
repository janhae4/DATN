import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('task_assignees')
export class TaskAssignee {
  @PrimaryColumn({ type: 'uuid' })
  taskId: string;

  @PrimaryColumn({ type: 'uuid' })
  teamMemberId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;
}
