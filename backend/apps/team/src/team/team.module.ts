import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import {
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  REDIS_EXCHANGE,
  TEAM_EXCHANGE,
  Team,
  TeamMember,
  USER_EXCHANGE
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseTeamUrl,
        entities: [Team, TeamMember],
        synchronize: true,
      })
    }),
    TypeOrmModule.forFeature([Team, TeamMember]),
    ClientConfigModule,
    RmqModule.register({
      exchanges: [
        {
          name: TEAM_EXCHANGE,
          type: 'direct'
        }
      ]
    })
  ],
  controllers: [TeamController],
  providers: [TeamService, TeamController],
})
export class TeamModule { }
