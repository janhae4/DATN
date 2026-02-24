import { Module } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { DISCUSSION_EXCHANGE, ClientConfigModule, ClientConfigService } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    RmqModule.register()
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService],
})
export class DiscussionModule { }
