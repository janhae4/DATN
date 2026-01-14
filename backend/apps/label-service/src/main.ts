import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { RpcResponseInterceptor } from '@app/common';
import { LabelsModule } from './labels/labels.module';

async function bootstrap() {
  const app = await NestFactory.create(LabelsModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();

  Logger.log('Label Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();