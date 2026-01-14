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
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}