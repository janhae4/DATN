// apps/project-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ClientConfigService } from '@app/contracts';
import { TestingServiceModule } from './testing-service.module';

async function bootstrap() {
  const appContext = await NestFactory.create(TestingServiceModule);
  const configService = appContext.get(ClientConfigService);
  appContext.connectMicroservice<MicroserviceOptions>(
    configService.testClientOptions,
  );

  await appContext.startAllMicroservices();
  await appContext.init();

  Logger.log('Testing Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();
