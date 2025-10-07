import { Module } from '@nestjs/common';
import { TaskServiceController } from './task-service.controller';
import { TaskServiceService } from './task-service.service';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleCalendarService } from './google-calendar.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { SharedJwtModule } from '@app/contracts/auth/jwt/jwt.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

@Module({
  imports: [PrismaModule, ClientConfigModule, SharedJwtModule],
  controllers: [TaskServiceController],
  providers: [TaskServiceService, GoogleCalendarService, CLIENT_PROXY_PROVIDER.USER_CLIENT],
})
export class TaskServiceModule {}
