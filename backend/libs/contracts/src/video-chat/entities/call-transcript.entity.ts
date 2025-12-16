import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Call } from './call.entity';

@Entity()
@Index(['callId'])
export class CallTranscript {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  callId: string;

  @ManyToOne(() => Call, (call) => call.callTranscripts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column()
  userId: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  timestamp: Date;
}