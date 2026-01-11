import { Module } from '@nestjs/common';
import { SprintsModule } from './sprints/sprints.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, Sprint, SPRINT_EXCHANGE } from '@app/contracts';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Global } from '@nestjs/common';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseSprintUrl,
        entities: [Sprint],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Sprint]),
    SprintsModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: SPRINT_EXCHANGE,
            type: 'direct',
          },
        ],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
})
export class SprintServiceModule {}
