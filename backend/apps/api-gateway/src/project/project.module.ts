import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ClientConfigModule, ClientConfigService, PROJECT_EXCHANGE, LIST_EXCHANGE, USER_EXCHANGE } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
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
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}