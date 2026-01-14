import { Module } from '@nestjs/common';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import {
    GMAIL_EXCHANGE,
    GMAIL_QUEUE,
    ClientConfigModule,
    ClientConfigService,
    EVENTS_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { RmqModule } from '@app/common';

@Module({
    imports: [
        ClientConfigModule,
        MailerModule.forRootAsync({
            imports: [ClientConfigModule],
            inject: [ClientConfigService],
            useFactory: (cfg: ClientConfigService) => ({
                transport: cfg.getSMTPTransport(),
                defaults: {
                    from: cfg.getSMTPFrom(),
                },
                template: {
                    dir: join(__dirname, '..', 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
        }),
        RmqModule.register({
            exchanges: [{ name: GMAIL_EXCHANGE, type: 'direct' }],
        })
    ],
    controllers: [GmailController],
    providers: [GmailService],
})
export class GmailModule { }
