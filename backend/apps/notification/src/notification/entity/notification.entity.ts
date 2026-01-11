import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { NotificationType } from '@app/contracts/enums/notification-type.enum';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    message: string;

    @Column()
    title: string;

    @Column({ default: false })
    isRead: boolean;

    @Column({ nullable: true })
    link: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ nullable: true })
    actionUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    readAt: Date;
}
