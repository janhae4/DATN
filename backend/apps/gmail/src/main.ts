import { NestFactory } from '@nestjs/core';
import { GmailModule } from './gmail/gmail.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ClientConfigService, GMAIL_QUEUE } from '@app/contracts';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
    const app = await NestFactory.create(GmailModule);
    app.useGlobalInterceptors(new RpcResponseInterceptor());
    await app.init()
    console.log(`Gmail Microservice is listening on queue: ${GMAIL_QUEUE} (NestJS Standard)`);
}
bootstrap();
