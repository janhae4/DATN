import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification/notification.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ClientConfigService } from '@app/contracts';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice(cfg.notificationClientOptions as MicroserviceOptions,);
  await app.startAllMicroservices();
}
bootstrap();
