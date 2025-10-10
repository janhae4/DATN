import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from './routes/user/user.module';
import { AuthModule } from './routes/auth/auth.module';
import { TasksModule } from './routes/tasks/tasks.module';
import { RpcToHttpInterceptor } from '../common/interceptor/rpc-to-http.interceptor';
import { HttpModule } from '@nestjs/axios';
import { RefreshTokenFilter } from '../common/filter/refresh-token.filter';

@Module({
  imports: [UserModule, AuthModule, TasksModule, HttpModule],
  controllers: [ApiGatewayController],
  providers: [RpcToHttpInterceptor, RefreshTokenFilter, ApiGatewayService],
})
export class ApiGatewayModule {}
