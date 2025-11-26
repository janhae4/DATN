import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import {
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  REDIS_EXCHANGE,
  TASK_EXCHANGE,
  Task,
  USER_EXCHANGE
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TaskLabel } from '../entities/task-label.entity';

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
    // 2. THÊM TaskLabel VÀO DÒNG DƯỚI ĐÂY 👇
    TypeOrmModule.forFeature([Task, TaskLabel]), 
    
    ClientConfigModule,
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