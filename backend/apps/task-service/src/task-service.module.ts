import { Module } from '@nestjs/common';
import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleCalendarService } from './google-calendar.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

@Module({
  imports: [PrismaModule, ClientConfigModule],
  controllers: [TaskServiceController],
  providers: [TaskServiceService, GoogleCalendarService],
})
export class TaskServiceModule {}
