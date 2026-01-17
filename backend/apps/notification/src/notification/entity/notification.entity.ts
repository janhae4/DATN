import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { NotificationType } from '@app/contracts/enums/notification-type.enum';
import { NotificationTargetType } from '@app/contracts';

export enum NotificationResource {
    TASK = 'TASK',
    COMMENT = 'COMMENT',
    TEAM = 'TEAM',
    SYSTEM = 'SYSTEM'
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    actorId: string;

    @Column()
    message: string;

    @Column()
    title: string;

    @Column({ default: false })
    isRead: boolean;


    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({
        type: 'enum',
        enum: NotificationResource,
        default: NotificationResource.SYSTEM
    })
    resourceType: NotificationResource;

    @Column({ nullable: true })
    resourceId: string;

    @Column({
        type: 'enum',
        enum: NotificationTargetType,
    })
    targetType: NotificationTargetType;

    @Column({ nullable: true })
    targetId: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    readAt: Date;
}
