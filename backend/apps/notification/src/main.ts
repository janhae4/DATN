import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification/notification.module';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();
}
bootstrap();
