import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../../libs/contracts/src/user/entity/user.entity';
import { Account } from '../../../../libs/contracts/src/user/entity/account.entity';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_USER_URL,
        entities: [User, Account],
        synchronize: true,
        logging: true,
      }),
    }),
    TypeOrmModule.forFeature([User, Account]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
