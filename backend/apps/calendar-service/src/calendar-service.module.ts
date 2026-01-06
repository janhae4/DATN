import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AUTH_EXCHANGE } from '@app/contracts'; // Import constant exchange của mom
import { CalendarController } from './calendar-service.controller';
import { CalendarService } from './calendar-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Kết nối RabbitMQ dùng để gọi Auth Service (golevelup style)
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        exchanges: [
          {
            name: AUTH_EXCHANGE,
            type: 'direct',
          }
        ],
        uri: config.get('RABBITMQ_URI') || 'amqp://guest:guest@localhost:5672',
        connectionInitOptions: { wait: true },
      }),
    }),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}