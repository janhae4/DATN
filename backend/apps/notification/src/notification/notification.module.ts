import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from './prisma.service';
import { NotificationController } from './notification.controller';
import { ClientConfigModule, ClientConfigService, NOTIFICATION_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        exchanges: [
          {
            name: NOTIFICATION_EXCHANGE,
            type: 'direct',
          }
        ],
        uri: cfg.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    })
  ],
  providers: [NotificationService, PrismaService, NotificationController],
  controllers: [NotificationController],
})
export class NotificationModule { }
