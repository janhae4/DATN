import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { RefreshTokenFilter } from '../common/filter/refresh-token.filter';
import { RpcToHttpExceptionFilter } from '../common/filter/rpc-to-http.filter';
import { TeamModule } from '../team/team.module';
import { VideoChatModule } from '../video-chat/video-chat.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    TasksModule,
    TeamModule,
    VideoChatModule,
    ChatbotModule,
  ],
  controllers: [ApiGatewayController],
  providers: [
    RpcToHttpExceptionFilter, 
    RefreshTokenFilter, 
    ApiGatewayService,
  ],
})
export class ApiGatewayModule {}
