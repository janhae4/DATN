import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';

@Module({
  imports: [ClientConfigModule, AuthModule],
  controllers: [TasksController],
  providers: [TasksService, CLIENT_PROXY_PROVIDER.TASK_CLIENT],
})
export class TasksModule {}
