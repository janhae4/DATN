import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Prisma } from '../generated/prisma';
import { PrismaService } from './prisma.service';
import { NotificationEvent } from './dto/notification.event';
import { NotificationUpdateDto } from './dto/notification-update.dto';
import { NotificationType } from '@app/contracts/notification/notification.enum';

@Injectable()
export class NotificationService {
    private server: Server;

    constructor(private readonly prisma: PrismaService) { }

    setServer(server: Server) {
        this.server = server;
    }

    subscribeUser(userId: string, client: Socket) {
        client.join(userId);
    }

    sendNotification(event: NotificationEvent) {
        if (!this.server) return;
        this.addNotification(event);
        this.server
            .to(event.userId)
            .emit('notification', { title: event.title, message: event.message, type: event.type });
    }

    addNotification(notification: NotificationEvent) {
        this.prisma.notification.create({
            data: {
                userId: notification.userId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
            },
        });
    }

    updateNotification(
        where: Prisma.NotificationWhereUniqueInput,
        data: NotificationUpdateDto,
    ) {
        this.prisma.notification.update({
            where,
            data,
        });
    }

    deleteNotification(where: Prisma.NotificationWhereUniqueInput) {
        this.prisma.notification.delete({
            where,
        });
    }

    markNotificationAsRead(where: Prisma.NotificationWhereUniqueInput) {
        this.prisma.notification.update({
            where,
            data: {
                isRead: true,
            },
        });
    }

    markNotificationAsUnread(where: Prisma.NotificationWhereUniqueInput) {
        this.prisma.notification.update({
            where,
            data: {
                isRead: false,
            },
        });
    }

    markAllNotificationsAsRead(userId: string) {
        this.prisma.notification.updateMany({
            where: {
                userId,
            },
            data: {
                isRead: true,
            },
        });
    }

    markAllNotificationsAsUnread(userId: string) {
        this.prisma.notification.updateMany({
            where: {
                userId,
            },
            data: {
                isRead: false,
            },
        });
    }

    getNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: {
                userId,
            },
        });
    }
}
