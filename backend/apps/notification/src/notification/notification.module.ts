import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ClientConfigModule, ClientConfigService, NOTIFICATION_EXCHANGE } from '@app/contracts';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entity/notification.entity';
import { NotificationGateway } from './notification.gateway';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: (cfg: ClientConfigService) => ({
        type: 'postgres',
        url: cfg.getNotificationDatabase(),
        autoLoadEntities: true,
        synchronize: true,
        keepConnectionAlive: true,
        extra: {
          connectionLimit: 10,
          idleTimeoutMillis: 30000,
        }
      }),
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
    }),
    TypeOrmModule.forFeature([Notification]),
    RmqModule.register({ exchanges: [{ name: NOTIFICATION_EXCHANGE, type: 'direct' }] }),
  ],
  providers: [NotificationService, NotificationController, NotificationGateway],
  controllers: [NotificationController],
})
export class NotificationModule { }
