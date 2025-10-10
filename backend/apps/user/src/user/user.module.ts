import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Account } from './entity/account.entity';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      name: 'USER_CONNECTION',
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_USER_URL,
        entities: [User, Account],
        synchronize: true,
      }),

    }),
    TypeOrmModule.forFeature([User, Account], 'USER_CONNECTION'),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    CLIENT_PROXY_PROVIDER.GMAIL_CLIENT,  // ✅ Thêm GMAIL_CLIENT provider
  ],
})
export class UserModule {}
