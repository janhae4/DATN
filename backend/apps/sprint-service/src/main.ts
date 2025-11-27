import { NestFactory } from '@nestjs/core';
import { SprintServiceModule } from './sprint-service.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ClientConfigService } from '@app/contracts';

async function bootstrap() {
  const appContext = await NestFactory.create(SprintServiceModule);
  const configService = appContext.get(ClientConfigService);
  appContext.connectMicroservice<MicroserviceOptions>(
    configService.sprintClientOptions,
  );

  await appContext.startAllMicroservices();
  await appContext.init();

  Logger.log('Sprint Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();