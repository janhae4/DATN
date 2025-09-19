import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigModule } from '../client-config/client-config.module';
import { AUTH_CLIENT, USER_CLIENT } from '@app/contracts/constants';
import { ClientConfigService } from '../client-config/client-config.service';

@Module({
  imports: [ClientConfigModule],
  controllers: [AuthController],
  providers: [AuthService, {
    provide: AUTH_CLIENT,
    useFactory: (configService: ClientConfigService) => ClientProxyFactory.create(configService.authClientOptions),
    inject: [ClientConfigService]
  }, {
      provide: USER_CLIENT,
      useFactory: (configService: ClientConfigService) => ClientProxyFactory.create(configService.userClientOptions),
      inject: [ClientConfigService]
    }],
})
export class AuthModule { }
