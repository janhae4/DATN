import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CLIENT_PROXY_PROVIDER } from "@app/contracts/client-config/client-config.provider";
import { ClientConfigModule } from "@app/contracts/client-config/client-config.module";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
    ClientConfigModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CLIENT_PROXY_PROVIDER.USER_CLIENT,
    CLIENT_PROXY_PROVIDER.NOTIFICATION_CLIENT,
    CLIENT_PROXY_PROVIDER.REDIS_CLIENT,
  ],
})
export class AuthModule {}
