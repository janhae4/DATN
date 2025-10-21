import { NestFactory } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { ClientConfigService } from '@app/contracts';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice(cfg.chatClientOptions as MicroserviceOptions);
  app.connectMicroservice(cfg.eventClientOptions as MicroserviceOptions);
  await app.startAllMicroservices();
}
bootstrap();
