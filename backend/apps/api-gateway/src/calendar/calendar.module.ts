import { forwardRef, Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientConfigModule,
    forwardRef(() => AuthModule),
    ClientsModule.registerAsync([
      {
        name: 'CALENDAR_SERVICE',
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getRMQUrl()],
            queue: 'calendar_queue', 
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}