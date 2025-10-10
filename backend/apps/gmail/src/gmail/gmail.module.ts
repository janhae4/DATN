import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { MailerModule } from '@nestjs-modules/mailer';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';

@Module({
  imports: [
    ClientConfigModule,
    MailerModule.forRootAsync({
      useFactory: (cfg: ClientConfigService) => ({
        transport: cfg.getSMTPHost(),
        defaults: {
          from: cfg.getSMTPFrom(),
        },
        preview:true
      })
    })
  ],
  controllers: [GmailController],
  providers: [GmailService,
    CLIENT_PROXY_PROVIDER.REDIS_CLIENT,
    CLIENT_PROXY_PROVIDER.AUTH_CLIENT
    
  ],
})
export class GmailModule { }
