import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CALENDAR_EXCHANGE } from '@app/contracts';
import { CalendarController } from './calendar-service.controller';
import { CalendarService } from './calendar-service.service';
import { RmqModule } from '@app/common';
import { RedisServiceModule } from '@app/redis-service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RmqModule.register({ exchanges: [{ name: CALENDAR_EXCHANGE, type: 'direct' }] }),
    RedisServiceModule
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule { }