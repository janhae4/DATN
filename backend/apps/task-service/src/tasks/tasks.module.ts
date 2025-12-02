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
  LABEL_CLIENT
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TaskLabel } from '@app/contracts/task/entity/task-label.entity';

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
    ClientsModule.registerAsync([
      {
        name: LABEL_CLIENT,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (configService: ClientConfigService) => configService.labelClientOptions,
      },
    ]),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: TASK_EXCHANGE,
            type: 'topic',
          },
          {
            name: EVENTS_EXCHANGE,
            type: 'topic',
          },
          {
            name: REDIS_EXCHANGE,
            type: 'direct',
          }
        ],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    })
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksController],
})
export class TasksModule { }