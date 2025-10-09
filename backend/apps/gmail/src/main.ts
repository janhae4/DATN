import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { GmailModule } from './gmail/gmail.module';
import { GMAIL_CLIENT_PORT } from '@app/contracts/constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GmailModule,
    {
      transport: Transport.TCP,
      options: {
        port: GMAIL_CLIENT_PORT,
      },
    },
  );
  await app.listen();
  console.log('Gmail microservice is listening');
}
bootstrap();