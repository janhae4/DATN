import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from './routes/user/user.module';
import { AuthModule } from './routes/auth/auth.module';
import { TasksModule } from './routes/tasks/tasks.module';
import { RefreshTokenFilter } from '../common/filter/refresh-token.filter';
import { RpcToHttpExceptionFilter } from '../common/filter/rpc-to-http.filter';
import { TeamModule } from './routes/team/team.module';
import { VideoChatModule } from './routes/video-chat/video-chat.module';

@Module({
  imports: [UserModule, AuthModule, TasksModule, TeamModule, VideoChatModule],
  controllers: [ApiGatewayController],
  providers: [RpcToHttpExceptionFilter, RefreshTokenFilter, ApiGatewayService],
})
export class ApiGatewayModule {}
