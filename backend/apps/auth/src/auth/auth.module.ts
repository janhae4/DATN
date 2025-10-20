import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PassportModule, ClientConfigModule, JwtModule.register({
    secret: process.env.JWT_ACCESS_SECRET,
    signOptions: { expiresIn: '15m' },
  })],
  controllers: [AuthController],
  providers: [
    AuthService,
    CLIENT_PROXY_PROVIDER.USER_CLIENT,
    CLIENT_PROXY_PROVIDER.SOCKET_CLIENT,
    CLIENT_PROXY_PROVIDER.REDIS_CLIENT,
    CLIENT_PROXY_PROVIDER.GMAIL_CLIENT,
  ],
})
export class AuthModule {}
