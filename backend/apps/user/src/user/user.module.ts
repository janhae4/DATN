import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Account } from './entity/account.entity';

@Module({
  imports: [
    ClientConfigModule, 
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_USER_URL,
      entities: [User, Account],
      synchronize: true,
    })
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
