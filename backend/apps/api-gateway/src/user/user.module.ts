import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientConfigModule } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
