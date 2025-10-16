import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { TeamController } from './team.controller';

@Module({
  imports: [ClientConfigModule],
  controllers: [TeamController],
  providers: [TeamService, CLIENT_PROXY_PROVIDER.TEAM_CLIENT],
})
export class TeamModule {}
