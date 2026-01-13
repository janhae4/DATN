import { Module } from '@nestjs/common';
import { ClientConfigModule, ClientConfigService, PROJECT_EXCHANGE, REDIS_CLIENT } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import Redis from 'ioredis';
import { TeamModule } from '../team/team.module';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    FileModule,
    ClientConfigModule,
    AuthModule,
    TeamModule,
    ClientsModule.registerAsync([
      {
        name: PROJECT_EXCHANGE,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => config.projectClientOptions,
      },
    ]),
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