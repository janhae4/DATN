import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { TeamModule } from '../team/team.module';
import { VideoChatModule } from '../video-chat/video-chat.module';
import { AiDiscussionModule } from '../discussion-ai/ai-discussion.module';
import { NotificationModule } from '../notification/notification.module';
import { FileModule } from '../file/file.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { DiscussionModule } from '../dicussion/discussion.module';
import { ResponseInterceptor } from '../common/filter/response.interceptor';

@Module({
  imports: [
    AuthModule,
    TeamModule,
    NotificationModule,
    UserModule,
    DiscussionModule,
    AiDiscussionModule,
    FileModule,
    WebhooksModule
  ],
  controllers: [ApiGatewayController],
  providers: [ResponseInterceptor, ApiGatewayService],
})
export class ApiGatewayModule { }
