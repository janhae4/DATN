import { NestFactory } from '@nestjs/core';
import { ListServiceModule } from './lists-service.module'; // File module chính tên là status-service

async function bootstrap() {
  const app = await NestFactory.create(ListServiceModule);
  await app.init();
  console.log('List (Status) microservice is listening (RPC Mode)');
}
bootstrap();