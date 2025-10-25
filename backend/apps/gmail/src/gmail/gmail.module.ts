import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import {
  CLIENT_PROXY_PROVIDER,
  ClientConfigModule,
  ClientConfigService,
} from '@app/contracts';

@Module({
  imports: [
    ClientConfigModule,
    MailerModule.forRootAsync({
      useFactory: (cfg: ClientConfigService) => ({
        transport: cfg.getSMTPTransport(),
        defaults: {
          from: cfg.getSMTPFrom(),
        },
        preview: true,
      }),
      inject: [ClientConfigService],
      imports: [ClientConfigModule],
    })
  ],
  controllers: [GmailController],
  providers: [GmailService, GmailController],
})
export class GmailModule { }
