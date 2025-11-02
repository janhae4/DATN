import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { ClientConfigModule, ClientConfigService, TEAM_EXCHANGE } from '@app/contracts';
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
        exchanges: [
          { name: TEAM_EXCHANGE, type: 'direct' },
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    })
  ],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule { }
