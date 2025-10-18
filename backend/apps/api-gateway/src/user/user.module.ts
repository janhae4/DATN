import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';

@Module({
  imports: [ClientConfigModule],
  controllers: [UserController],
  providers: [UserService, CLIENT_PROXY_PROVIDER.USER_CLIENT],
  exports: [UserService],
})
export class UserModule {}
