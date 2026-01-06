import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Call } from './call.entity';

export enum CallRole {
  HOST = 'HOST',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  BANNED = 'BANNED',
}

@Entity()
@Unique(['callId', 'userId'])
export class CallParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  callId: string;

  @ManyToOne(() => Call, (call) => call.participants, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column()
  userId: string;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date | null;

  @Column({ type: 'enum', enum: CallRole, default: CallRole.MEMBER })
  role: CallRole;

  @Column({ default: false })
  isSharingScreen: boolean;
}