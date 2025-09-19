import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ClientConfigModule } from './client-config/client-config.module';

@Module({
  imports: [UserModule, AuthModule, ClientConfigModule],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
