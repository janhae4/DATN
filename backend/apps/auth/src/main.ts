import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  await app.init();
  console.log('Auth microservice is listening (RPC Mode)');
}
bootstrap();
