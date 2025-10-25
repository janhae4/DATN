import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { typeOrmConfig } from './typeorm.config';
import {
  CLIENT_PROXY_PROVIDER,
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  Team,
  TEAM_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([Team]),
    ClientConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: TEAM_EXCHANGE,
            type: 'direct',
          },
          {
            name: EVENTS_EXCHANGE,
            type: 'topic',
          }
        ],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    })
  ],
  controllers: [TeamController],
  providers: [TeamService, TeamController],
})
export class TeamModule { }
