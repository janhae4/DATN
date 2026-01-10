import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_EXCHANGE, ClientConfigModule, ClientConfigService, EVENTS_EXCHANGE, GMAIL_EXCHANGE, NOTIFICATION_EXCHANGE, REDIS_EXCHANGE, USER_EXCHANGE } from '@app/contracts';
import { JwtModule } from '@nestjs/jwt';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

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
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        exchanges: [
          {
            name: AUTH_EXCHANGE,
            type: 'direct'
          }
        ],
        uri: cfg.getRMQUrl(),
        connectionInitOptions: { wait: true, timeout: 20000 },
        logger: {
          error: (str: string) => {
            console.error(str);
          },
          log: (str: string) => {
            console.log(str);
          },
          warn: (str: string) => {
            console.warn(str);
          },
        },
      }),
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthController],
})
export class AuthModule { }
