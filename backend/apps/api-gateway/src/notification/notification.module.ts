import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService, 
    CLIENT_PROXY_PROVIDER.NOTIFICATION_CLIENT
  ],
})
export class NotificationModule {}
