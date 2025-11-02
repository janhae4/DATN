import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { TeamModule } from '../team/team.module';
import { VideoChatModule } from '../video-chat/video-chat.module';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { NotificationModule } from '../notification/notification.module';
import { RpcErrorToHttpFilter } from '../common/filter/rpc-to-http.filter';
import { FileModule } from '../file/file.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { DiscussionModule } from '../dicussion/discussion.module';

@Module({
  imports: [
    AuthModule,
    TeamModule,
    ChatbotModule,
    NotificationModule,
    UserModule,
    DiscussionModule,
    FileModule,
    WebhooksModule
  ],
  controllers: [ApiGatewayController],
  providers: [RpcErrorToHttpFilter, ApiGatewayService],
})
export class ApiGatewayModule {}
