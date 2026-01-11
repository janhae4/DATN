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
        RabbitMQModule.forRootAsync({
            imports: [ClientConfigModule],
            inject: [ClientConfigService],
            useFactory: (cfg: ClientConfigService) => ({
                exchanges: [
                    {
                        name: GMAIL_EXCHANGE,
                        type: 'direct',
                    },
                ],
                uri: cfg.getRMQUrl(),
                connectionInitOptions: { wait: true, timeout: 20000 },
                logger: {
                    error: (str: string) => {
                        console.error('[RabbitMQ Error]', str);
                    },
                    log: (str: string) => {
                        console.log('[RabbitMQ]', str);
                    },
                    warn: (str: string) => {
                        console.warn('[RabbitMQ Warning]', str);
                    },
                },
            }),
        }),
    ],
    controllers: [GmailController],
    providers: [GmailService],
})
export class GmailModule { }
