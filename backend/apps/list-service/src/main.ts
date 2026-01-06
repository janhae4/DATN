// apps/project-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ClientConfigService } from '@app/contracts';
import { ListServiceModule } from './lists-service.module';

async function bootstrap() {
  const appContext = await NestFactory.create(ListServiceModule);
  const configService = appContext.get(ClientConfigService);
  appContext.connectMicroservice<MicroserviceOptions>(
    configService.listClientOptions,
  );

  await appContext.startAllMicroservices();
  await appContext.init();

  Logger.log('List Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();
