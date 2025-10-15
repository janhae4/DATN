import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

@Module({
  imports: [ClientConfigModule],
  controllers: [UserController],
  providers: [UserService, CLIENT_PROXY_PROVIDER.USER_CLIENT],
  exports: [UserService],
})
export class UserModule {}
