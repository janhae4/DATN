import { Module } from '@nestjs/common';
import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleCalendarService } from './google-calendar.service';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';

@Module({
  imports: [PrismaModule, ClientConfigModule],
  controllers: [TaskServiceController],
  providers: [
    TaskServiceService,
    GoogleCalendarService,
    CLIENT_PROXY_PROVIDER.REDIS_CLIENT,
    CLIENT_PROXY_PROVIDER.TASK_NER_CLIENT,
  ],
})
export class TaskServiceModule {}
