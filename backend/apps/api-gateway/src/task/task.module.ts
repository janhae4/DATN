import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ClientConfigModule, ClientConfigService, REDIS_CLIENT } from '@app/contracts';
=======
import { ClientConfigModule, ClientConfigService, PROJECT_EXCHANGE, REDIS_CLIENT } from '@app/contracts';
>>>>>>> origin/blank_branch
import { AuthModule } from '../auth/auth.module';
import { FileModule } from '../file/file.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import Redis from 'ioredis';
<<<<<<< HEAD
=======
import { TeamModule } from '../team/team.module';
import { ClientsModule } from '@nestjs/microservices';
>>>>>>> origin/blank_branch

@Module({
  imports: [
    FileModule,
    ClientConfigModule,
    AuthModule,
<<<<<<< HEAD
=======
    TeamModule,
    ClientsModule.registerAsync([
      {
        name: PROJECT_EXCHANGE,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (config: ClientConfigService) => config.projectClientOptions,
      },
    ]),
>>>>>>> origin/blank_branch
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