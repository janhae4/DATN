import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { typeOrmConfig } from './typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '@app/contracts/team/team.entity';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([Team]),
    ClientConfigModule,
  ],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
