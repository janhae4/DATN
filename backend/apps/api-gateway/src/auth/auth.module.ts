import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ClientConfigModule } from '../../../../libs/contracts/src/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { UserModule } from '../user/user.module';
import { GoogleStrategy } from 'apps/auth/src/auth/config/google.strategy';

@Module({
  imports: [ClientConfigModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, CLIENT_PROXY_PROVIDER.AUTH_CLIENT, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
