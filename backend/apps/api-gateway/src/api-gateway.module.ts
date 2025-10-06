import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ClientConfigModule } from '../../../libs/contracts/src/client-config/client-config.module';
import { APP_GUARD } from '@nestjs/core';
import { RoleGuard } from './role.guard';
import { RedisModule } from './redis/redis.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [UserModule, AuthModule, ClientConfigModule, RedisModule, TasksModule],
  controllers: [ApiGatewayController],
  providers: [
    ApiGatewayService,
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class ApiGatewayModule {}
