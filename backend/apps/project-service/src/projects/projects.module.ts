import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from '@app/contracts/project/entity/project.entity';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, PROJECT_EXCHANGE, LIST_EXCHANGE, USER_EXCHANGE } from '@app/contracts';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
        exchanges: [
          { name: PROJECT_EXCHANGE, type: 'topic' },
          { name: LIST_EXCHANGE, type: 'topic' },
          { name: USER_EXCHANGE, type: 'direct' },
        ],
      }),
    }),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}