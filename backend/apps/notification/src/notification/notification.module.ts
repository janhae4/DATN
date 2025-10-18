import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from './prisma.service';
import { NotificationController } from './notification.controller';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';

@Module({
  imports: [ClientConfigModule],
  providers: [
    NotificationGateway,
    NotificationService,
    PrismaService,
    CLIENT_PROXY_PROVIDER.AUTH_CLIENT,
  ],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
