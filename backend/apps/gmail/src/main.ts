import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GmailModule } from './gmail/gmail.module';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';

async function bootstrap() {
  const app = await NestFactory.create(GmailModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice(cfg.gmailClientOptions as MicroserviceOptions);
  await app.startAllMicroservices();
  console.log('Gmail microservice is listening', cfg.getGmailClientPort());
}
bootstrap();