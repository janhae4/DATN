import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from './prisma.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

@Module({
  imports: [ClientConfigModule],
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UserModule {}
