import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigModule } from '../../client-config/client-config.module';
import { ClientConfigService } from '../../client-config/client-config.service';
import { USER_CLIENT } from '@app/contracts/constants';

@Module({
  imports: [ClientConfigModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_CLIENT,
      useFactory: (configService: ClientConfigService) =>
        ClientProxyFactory.create(configService.userClientOptions),
      inject: [ClientConfigService],
    },
  ],
})
export class UserModule {}
