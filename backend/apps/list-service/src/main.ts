import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ListServiceModule } from './lists-service.module';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(ListServiceModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();

  Logger.log('List Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();
