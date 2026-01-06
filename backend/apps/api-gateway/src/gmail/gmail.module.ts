import { Module } from '@nestjs/common';
import { GmailGatewayController } from './gmail.controller';
import { GmailGatewayService } from './gmail.service';
import { AuthModule } from '../auth/auth.module';
import { ClientConfigModule, ClientConfigService, GMAIL_CLIENT, GMAIL_QUEUE } from '@app/contracts';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        AuthModule,
        ClientConfigModule,
        ClientsModule.registerAsync([
            {
                name: GMAIL_CLIENT,
                imports: [ClientConfigModule],
                inject: [ClientConfigService],
                useFactory: (configService: ClientConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.getRMQUrl()],
                        queue: GMAIL_QUEUE,
                        queueOptions: {
                            durable: true
                        },
                    },
                }),
            },
        ]),
    ],
    controllers: [GmailGatewayController],
    providers: [GmailGatewayService],
})
export class GmailModule { }
