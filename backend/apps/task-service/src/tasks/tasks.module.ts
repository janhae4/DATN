import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import {
  ClientConfigModule,
  ClientConfigService,
  Task,
} from '@app/contracts';
import { TaskLabel } from '@app/contracts/task/entity/task-label.entity';
import { AiStreamService } from './ai-stream.service';
import { RmqModule } from '@app/common';
import { RedisServiceModule } from '@app/redis-service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseTaskUrl,
        entities: [Task, TaskLabel],
        synchronize: true,
      })
    }),
    TypeOrmModule.forFeature([Task, TaskLabel]),
    RedisServiceModule,
    ClientConfigModule,
    RmqModule.register()
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksController, AiStreamService],
})
export class TasksModule { }