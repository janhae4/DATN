import { Module } from '@nestjs/common';
import { ClientConfigModule } from '../../../libs/contracts/src/client-config/client-config.module';
import { APP_GUARD } from '@nestjs/core';
import { RoleGuard } from './role.guard';
import { ApiGatewayController } from './api-gateway/api-gateway.controller';
import { UserModule } from './api-gateway/routes/user/user.module';
import { AuthModule } from './api-gateway/routes/auth/auth.module';
import { TeamModule } from 'apps/team/src/team/team.module';
import { TasksModule } from './api-gateway/routes/tasks/tasks.module';
import { ApiGatewayService } from './api-gateway/api-gateway.service';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ClientConfigModule,
    TeamModule,
    TasksModule,
  ],
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
