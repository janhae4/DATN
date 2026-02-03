import { Module } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { ClientConfigModule } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    UserModule,
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService],
})
export class DiscussionModule { }
