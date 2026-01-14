import { forwardRef, Module } from '@nestjs/common';
import { EpicController } from './epic.controller';
import { EpicService } from './epic.service';
import { AuthModule } from '../auth/auth.module';
import { ClientConfigModule } from '@app/contracts';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    ClientConfigModule,
    forwardRef(() => TeamModule),
  ],

  controllers: [EpicController],
  providers: [EpicService],
  exports: [EpicService],
})
export class EpicModule { }