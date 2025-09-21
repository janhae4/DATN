import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { REDIS_CLIENT, USER_CLIENT } from '@app/contracts/constants';

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
})
export class AuthModule {}
