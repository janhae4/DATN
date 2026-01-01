import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { AUTH_EXCHANGE, ClientConfigModule, ClientConfigService } from '@app/contracts';
import { GoogleStrategy } from '../common/google.strategy';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule { }
