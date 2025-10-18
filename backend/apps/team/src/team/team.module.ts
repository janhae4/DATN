import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { typeOrmConfig } from './typeorm.config';
import { ClientConfigModule, Team } from '@app/contracts';

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
