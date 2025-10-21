import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { typeOrmConfig } from './typeorm.config';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule, Team } from '@app/contracts';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([Team]),
    ClientConfigModule,
  ],
  controllers: [TeamController],
  providers: [
    TeamService,
    CLIENT_PROXY_PROVIDER.EVENT_CLIENT,
    CLIENT_PROXY_PROVIDER.USER_CLIENT
  ],
})
export class TeamModule {}
