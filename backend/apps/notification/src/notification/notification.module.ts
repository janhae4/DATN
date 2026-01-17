import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ClientConfigModule, NOTIFICATION_EXCHANGE } from '@app/contracts';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entity/notification.entity';
import { NotificationGateway } from './notification.gateway';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_NOTIFICATION_URL,
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Notification]),
    RmqModule.register({ exchanges: [{ name: NOTIFICATION_EXCHANGE, type: 'direct' }] }),
  ],
  providers: [NotificationService, NotificationController, NotificationGateway],
  controllers: [NotificationController],
})
export class NotificationModule { }
