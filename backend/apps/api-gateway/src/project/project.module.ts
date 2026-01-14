import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { AuthModule } from '../auth/auth.module';
import { ProjectService } from './project.service';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    AuthModule,
    TeamModule,
  ],

  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule { }
