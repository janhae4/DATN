import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule } from '@nestjs/config';
import { AUTH_EXCHANGE, ClientConfigModule, ClientConfigService } from '@app/contracts'; // Import constant exchange của mom
import { CalendarController } from './calendar-service.controller';
import { CalendarService } from './calendar-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Kết nối RabbitMQ dùng để gọi Auth Service (golevelup style)
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: AUTH_EXCHANGE,
            type: 'direct',
          }
        ],
        uri: config.getRMQUrl() || 'amqp://guest:guest@localhost:5672',
        connectionInitOptions: { wait: true },
      }),
    }),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule { }