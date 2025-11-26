import { NestFactory } from '@nestjs/core';
import { EpicServiceModule } from './epic-service.module';

async function bootstrap() {
  const app = await NestFactory.create(EpicServiceModule);
  await app.init();
  console.log('Epic microservice is listening (RPC Mode)');
}
bootstrap();