import { NestFactory } from '@nestjs/core';
import { SprintServiceModule } from './sprint-service.module';
import { Logger } from '@nestjs/common';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(SprintServiceModule)
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();

  Logger.log('Sprint Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();