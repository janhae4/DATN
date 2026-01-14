import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { ClientConfigModule} from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
  ],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule { }
