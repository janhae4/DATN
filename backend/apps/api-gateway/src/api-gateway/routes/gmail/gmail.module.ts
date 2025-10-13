import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

@Module({
  imports: [ClientConfigModule],
  controllers: [GmailController],
  providers: [GmailService, CLIENT_PROXY_PROVIDER.GMAIL_CLIENT],
})
export class GmailModule {}
