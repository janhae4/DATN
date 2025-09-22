import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATION_CLIENT, REDIS_CLIENT, USER_CLIENT } from '@app/contracts/constants';
import { ConfigModule } from '@nestjs/config';

ConfigModule.forRoot();
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
    ClientsModule.register([
      {
        name: USER_CLIENT,
        transport: Transport.TCP,
        options: { port: Number(process.env.USER_CLIENT_PORT) || 3003 },
      },
      {
        name: REDIS_CLIENT,
        transport: Transport.REDIS,
        options: { port: Number(process.env.REDIS_CLIENT_PORT) || 6379 },
      },
      {
        name: NOTIFICATION_CLIENT,
        transport: Transport.REDIS,
        options: { port: 6379 },
      }
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
