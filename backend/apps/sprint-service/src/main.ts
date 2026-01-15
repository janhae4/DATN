import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { RpcResponseInterceptor } from '@app/common';
import { SprintsModule } from './sprints/sprints.module';

async function bootstrap() {
  const app = await NestFactory.create(SprintsModule)
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();

  Logger.log('Sprint Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();