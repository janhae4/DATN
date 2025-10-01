import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from './prisma.service';
import { NotificationController } from './notification.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

@Module({
  imports: [ClientConfigModule],
  providers: [NotificationGateway, NotificationService, PrismaService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
