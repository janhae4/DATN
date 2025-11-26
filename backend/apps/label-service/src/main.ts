import { NestFactory } from '@nestjs/core';
import { LabelServiceModule } from './label-service.module';

async function bootstrap() {
  const app = await NestFactory.create(LabelServiceModule);
  await app.init();
  console.log('Label microservice is listening (RPC Mode)');
}
bootstrap();