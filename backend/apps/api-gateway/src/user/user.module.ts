import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
<<<<<<< HEAD
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigModule } from '../../client-config/client-config.module';
import { ClientConfigService } from '../../client-config/client-config.service';
import { USER_CLIENT } from '@app/contracts/constants';
=======
import { ClientConfigModule } from '../../../../libs/contracts/src/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
>>>>>>> main

@Module({
  imports: [ClientConfigModule],
  controllers: [UserController],
<<<<<<< HEAD
  providers: [
    UserService,
    {
      provide: USER_CLIENT,
      useFactory: (configService: ClientConfigService) =>
        ClientProxyFactory.create(configService.userClientOptions),
      inject: [ClientConfigService],
    },
  ],
=======
  providers: [UserService, CLIENT_PROXY_PROVIDER.USER_CLIENT],
  exports: [UserService],
>>>>>>> main
})
export class UserModule {}
