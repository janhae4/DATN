import { Module } from '@nestjs/common';
import { ClientConfigModule, ClientConfigService, REDIS_CLIENT } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import Redis from 'ioredis';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    FileModule,
    ClientConfigModule,
    AuthModule,
    TeamModule,
  ],
  providers: [
    TaskService,
    {
      provide: REDIS_CLIENT,
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => {
        return new Redis({
          host: config.getRedisHost() || 'localhost',
          port: config.getRedisClientPort() || 6379,
        });
      },
    }],
  controllers: [TaskController],

  exports: [TaskService],
})
export class TaskModule { }