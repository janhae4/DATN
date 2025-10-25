import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification/notification.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  await app.init();
}
bootstrap();
