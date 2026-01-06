import { NestFactory } from '@nestjs/core';
import { EpicServiceModule } from './epic-service.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ClientConfigService } from '@app/contracts';

async function bootstrap() {
 const appContext = await NestFactory.create(EpicServiceModule);
  const configService = appContext.get(ClientConfigService);
  appContext.connectMicroservice<MicroserviceOptions>(
    configService.epicClientOptions,
  );

  await appContext.startAllMicroservices();
  await appContext.init();
  Logger.log('Epic Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();