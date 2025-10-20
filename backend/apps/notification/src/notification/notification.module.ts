import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from './prisma.service';
import { NotificationController } from './notification.controller';
import { ClientConfigModule } from '@app/contracts';

@Module({
  imports: [
    ClientConfigModule
  ],
  providers: [
    NotificationService,
    PrismaService,
  ],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
