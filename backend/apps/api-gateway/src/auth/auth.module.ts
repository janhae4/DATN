import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { AUTH_EXCHANGE, CLIENT_PROXY_PROVIDER, ClientConfigModule, ClientConfigService } from '@app/contracts';
import { GoogleStrategy } from '../common/google.strategy';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    forwardRef(() => UserModule),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: AUTH_EXCHANGE,
            type: 'direct',
          },
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
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
        }
      })
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule { }
