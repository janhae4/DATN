import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';
import { GoogleStrategy } from '../common/google.strategy';

@Module({
  imports: [ClientConfigModule, UserModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    CLIENT_PROXY_PROVIDER.AUTH_CLIENT,
    CLIENT_PROXY_PROVIDER.USER_CLIENT,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
