import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { ClientConfigModule } from '../../../../libs/contracts/src/client-config/client-config.module';
import { APP_GUARD } from '@nestjs/core';
import { RoleGuard } from '../role.guard';
import { RedisModule } from '../redis/redis.module';
import { TasksModule } from '../tasks/tasks.module';
import { SharedJwtModule } from '@app/contracts/auth/jwt/jwt.module';
import { RpcToHttpInterceptor } from '../rpc-to-http.interceptor';
import { RefreshTokenInterceptor } from '../refresh-token.interceptor';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ClientConfigModule,
    RedisModule,
    SharedJwtModule,
    TasksModule,
    HttpModule,
  ],
  controllers: [ApiGatewayController],
  providers: [
    RpcToHttpInterceptor,
    RefreshTokenInterceptor,
    ApiGatewayService,
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class ApiGatewayModule {}
