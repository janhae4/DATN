import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from './routes/user/user.module';
import { AuthModule } from './routes/auth/auth.module';
import { TasksModule } from './routes/tasks/tasks.module';
import { HttpModule } from '@nestjs/axios';
import { RpcToHttpInterceptor } from '../common/interceptor/rpc-to-http.interceptor';
import { RefreshTokenFilter } from '../common/filter/refresh-token.filter';
import { GmailModule } from './routes/gmail/gmail.module';
import { VideoChatModule } from './routes/video-chat/video-chat.module';
import { ClientsModule } from '@nestjs/microservices';
import { VIDEO_CHAT_CLIENT } from '@app/contracts/constants';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    TasksModule,
    HttpModule,
    ClientConfigModule,
    GmailModule,
    VideoChatModule,
    ClientsModule.registerAsync([
      {
        name: VIDEO_CHAT_CLIENT,
        useFactory: (cfg: ClientConfigService) => cfg.videoChatClientOptions,
        inject: [ClientConfigService],
      },
    ]),
  ],
  controllers: [ApiGatewayController],
  providers: [RpcToHttpInterceptor, RefreshTokenFilter, ApiGatewayService],
})
export class ApiGatewayModule {}
