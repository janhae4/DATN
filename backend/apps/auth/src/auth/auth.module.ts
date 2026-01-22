import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_EXCHANGE, ClientConfigModule, ClientConfigService, EVENTS_EXCHANGE, GMAIL_EXCHANGE, NOTIFICATION_EXCHANGE, REDIS_EXCHANGE, USER_EXCHANGE } from '@app/contracts';
import { JwtModule } from '@nestjs/jwt';
import { RmqModule } from '@app/common';
import { RedisServiceModule } from '@app/redis-service';

@Module({
  imports: [
    PassportModule,
    ClientConfigModule,
    JwtModule.registerAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        secret: cfg.getJWTSecret(),
      }),
    }),
    RmqModule.register({
      exchanges: [
        { name: AUTH_EXCHANGE, type: 'direct' },
      ]
    }),
    RedisServiceModule
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthController],
})
export class AuthModule { }
