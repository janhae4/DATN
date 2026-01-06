// apps/project-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ClientConfigService } from '@app/contracts';
import { ProjectServiceModule } from './project-service.module';

async function bootstrap() {
  const appContext = await NestFactory.create(ProjectServiceModule);
  const configService = appContext.get(ClientConfigService);
  appContext.connectMicroservice<MicroserviceOptions>(
    configService.projectClientOptions,
  );

  await appContext.startAllMicroservices();
  await appContext.init();

  Logger.log('Project Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();
