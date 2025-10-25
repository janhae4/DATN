import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {
  Account,
  CLIENT_PROXY_PROVIDER,
  ClientConfigModule,
  ClientConfigService,
  Follow,
  User,
  USER_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_USER_URL,
        entities: [User, Account, Follow],
        synchronize: true,
        logging: true,
      }),
    }),
    TypeOrmModule.forFeature([User, Account, Follow]),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: USER_EXCHANGE,
            type: 'direct',
          },
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false }
      }),
    })
  ],
  controllers: [UserController],
  providers: [UserService, UserController],
})
export class UserModule { }
