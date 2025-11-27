import { NestFactory } from '@nestjs/core';
import { LabelServiceModule } from './label-service.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ClientConfigService } from '@app/contracts';

async function bootstrap() {
  const appContext = await NestFactory.create(LabelServiceModule);
  const configService = appContext.get(ClientConfigService);
  appContext.connectMicroservice<MicroserviceOptions>(
    configService.labelClientOptions,
  );

  await appContext.startAllMicroservices();
  await appContext.init();

  Logger.log('Label Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();