import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ClientConfigModule, AuthModule],
  controllers: [TasksController],
  providers: [TasksService, CLIENT_PROXY_PROVIDER.TASK_CLIENT],
})
export class TasksModule {}
