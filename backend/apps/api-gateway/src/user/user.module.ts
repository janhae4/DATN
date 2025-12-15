import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientConfigModule, ClientConfigService, USER_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    forwardRef(() => AuthModule),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (clientConfigService: ClientConfigService) => ({
        exchanges: [
          { name: USER_EXCHANGE, type: 'direct' },
        ],
        uri: clientConfigService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      })
    })
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
