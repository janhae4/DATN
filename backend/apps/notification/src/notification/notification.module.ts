import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ClientConfigModule, ClientConfigService, NOTIFICATION_EXCHANGE, EVENTS_EXCHANGE, GMAIL_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entity/notification.entity';
import { NotificationGateway } from './notification.gateway';

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
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        exchanges: [
          {
            name: NOTIFICATION_EXCHANGE,
            type: 'direct',
          },
          {
            name: EVENTS_EXCHANGE,
            type: 'topic',
          },
          {
            name: GMAIL_EXCHANGE,
            type: 'topic',
          }
        ],
        uri: cfg.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    })
  ],
  providers: [NotificationService, NotificationController, NotificationGateway],
  controllers: [NotificationController],
})
export class NotificationModule { }
