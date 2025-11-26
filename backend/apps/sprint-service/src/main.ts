import { NestFactory } from '@nestjs/core';
import { SprintServiceModule } from './sprint-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SprintServiceModule);
  await app.init();
  console.log('Sprint microservice is listening (RPC Mode)');
}
bootstrap();