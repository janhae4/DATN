import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ClientConfigModule, AuthModule],
  controllers: [TeamController],
  providers: [TeamService, CLIENT_PROXY_PROVIDER.TEAM_CLIENT],
})
export class TeamModule {}
