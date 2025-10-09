import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientConfigModule } from '../../../../../../libs/contracts/src/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

@Module({
  imports: [ClientConfigModule],
  controllers: [UserController],
  providers: [UserService, CLIENT_PROXY_PROVIDER.USER_CLIENT],
  exports: [UserService],
})
export class UserModule {}
