import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('task_labels')
export class TaskLabel {
  @PrimaryColumn({ type: 'uuid' })
  labelId: string;

  @Column({ name: 'label_name', nullable: true })
  labelName: string;

  @Column({ name: 'label_color', nullable: true })
  labelColor: string;
}