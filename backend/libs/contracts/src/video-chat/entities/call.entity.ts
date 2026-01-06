import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { CallActionItem } from './call-action-item.entity';
import { CallParticipant } from './call-participant.entity';
import { CallSummaryBlock } from './call-summary-block.entity';
import { CallTranscript } from './call-transcript.entity';
import { RefType } from '../enum';



@Entity()
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  roomId: string;

  @Column()
  teamId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ nullable: true })
  refId: string;

  @Column({ type: 'enum', enum: RefType, nullable: true })
  refType: RefType;

  @OneToMany(() => CallParticipant, (participant) => participant.call)
  participants: CallParticipant[];

  @OneToMany(() => CallTranscript, (transcript) => transcript.call)
  callTranscripts: CallTranscript[];

  @OneToMany(() => CallSummaryBlock, (summary) => summary.call)
  callSummaryBlocks: CallSummaryBlock[];

  @OneToMany(() => CallActionItem, (actionItem) => actionItem.call)
  callActionItems: CallActionItem[];
}