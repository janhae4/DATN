import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import {
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  REDIS_EXCHANGE,
  TASK_EXCHANGE,
  Task,
  USER_EXCHANGE,
  LABEL_CLIENT,
  PROJECT_CLIENT,
  LIST_CLIENT
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TaskLabel } from '@app/contracts/task/entity/task-label.entity';
import { AiStreamService } from './ai-stream.service';
import { RmqModule } from '@app/common';

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

    ClientConfigModule,
    RmqModule.register({
      exchanges: [
        { name: TASK_EXCHANGE, type: 'direct' }
      ]
    })
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksController, AiStreamService],
})
export class TasksModule { }