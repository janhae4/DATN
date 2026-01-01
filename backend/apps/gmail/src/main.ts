import { NestFactory } from '@nestjs/core';
import { GmailModule } from './gmail/gmail.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ClientConfigService, GMAIL_QUEUE } from '@app/contracts';

async function bootstrap() {
    const app = await NestFactory.create(GmailModule);
    const configService = app.get(ClientConfigService);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [configService.getRMQUrl()],
            queue: GMAIL_QUEUE,
            queueOptions: {
                durable: true
            },
        },
    });

    await app.startAllMicroservices();
    console.log(`Gmail Microservice is listening on queue: ${GMAIL_QUEUE} (NestJS Standard)`);
}
bootstrap();
