import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Call } from './call.entity';

@Entity()
@Index(['callId'])
export class CallActionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  callId: string;

  @ManyToOne(() => Call, (call) => call.callActionItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column('text')
  content: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ nullable: true })
  assigneeId: string;

  @Column({ nullable: true })
  assigneeName: string;

  @Column('text', { array: true, nullable: true })
  skillNames: string[];

  @Column({ type: 'int', nullable: true, default: 0 })
  experience: number;

  @CreateDateColumn()
  createdAt: Date;
}