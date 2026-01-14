import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {
  Account,
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  Follow,
  TEAM_EXCHANGE,
  User,
  USER_EXCHANGE,
  UserSkill,
} from '@app/contracts';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_USER_URL,
        entities: [User, Account, Follow, UserSkill],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([User, Account, Follow, UserSkill]),
    RmqModule.register({
      exchanges: [
        { name: USER_EXCHANGE, type: 'direct' },
      ]
    })
  ],
  controllers: [UserController],
  providers: [UserService, UserController],
})
export class UserModule { }
