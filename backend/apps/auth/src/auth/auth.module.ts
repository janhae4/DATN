import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { REDIS_CLIENT, USER_CLIENT } from '@app/contracts/constants';
=======
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
>>>>>>> main

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
<<<<<<< HEAD
    ClientsModule.register([
      {
        name: USER_CLIENT,
        transport: Transport.TCP,
        options: { port: 3001 },
      },
    ]),
    ClientsModule.register([
      {
        name: REDIS_CLIENT,
        transport: Transport.REDIS,
        options: { port: 6379 },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
=======
    ClientConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CLIENT_PROXY_PROVIDER.USER_CLIENT,
    CLIENT_PROXY_PROVIDER.NOTIFICATION_CLIENT,
    CLIENT_PROXY_PROVIDER.REDIS_CLIENT,
  ],
>>>>>>> main
})
export class AuthModule {}
