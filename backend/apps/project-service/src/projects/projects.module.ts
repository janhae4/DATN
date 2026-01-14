import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from '@app/contracts/project/entity/project.entity';
import {
  ClientConfigModule,
  ClientConfigService,
  LIST_EXCHANGE,
  PROJECT_EXCHANGE,
} from '@app/contracts';
import { ClientsModule } from '@nestjs/microservices';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseProjectUrl,
        entities: [Project],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Project]),
    RmqModule.register({
      exchanges: [{
        name: PROJECT_EXCHANGE,
        type: 'direct',
      }],
    }),
  ],

  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule { }