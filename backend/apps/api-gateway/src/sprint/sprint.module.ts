import { Module } from '@nestjs/common';
import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';
import {
  ClientConfigModule,
} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    AuthModule,
    ClientConfigModule,
    TeamModule,
  ],
  controllers: [SprintController],
  providers: [SprintService],
})
export class SprintModule { }