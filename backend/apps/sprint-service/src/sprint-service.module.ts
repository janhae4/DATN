import { Module } from '@nestjs/common';
import { SprintsModule } from './sprints/sprints.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, Sprint } from '@app/contracts';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Global } from '@nestjs/common';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [{ name: 'sprint_exchange', type: 'topic' }],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  exports: [RabbitMQModule], // Export để các module con dùng được AmqpConnection
})
class SprintRabbitMQModule {}

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
            name: 'sprint_exchange',
            type: 'topic',
          },
        ],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
    SprintRabbitMQModule,
  ],
})
export class SprintServiceModule {}
