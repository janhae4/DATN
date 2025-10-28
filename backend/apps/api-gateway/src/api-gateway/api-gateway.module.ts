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
import { ChatModule } from '../chat/chat.module';
import { RpcErrorToHttpFilter } from '../common/filter/rpc-to-http.filter';

@Module({
  imports: [
    AuthModule,
    TasksModule,
    TeamModule,
    VideoChatModule,
    ChatbotModule,
    NotificationModule,
    UserModule,
    ChatModule,
  ],
  controllers: [ApiGatewayController],
  providers: [RpcErrorToHttpFilter, ApiGatewayService],
})
export class ApiGatewayModule {}
