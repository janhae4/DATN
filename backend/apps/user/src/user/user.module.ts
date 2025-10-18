import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Account, ClientConfigModule, User } from '@app/contracts';

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
