import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(RedisModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();
  console.log('Redis microservice is running and listening for RabbitMQ messages on port 3006');
}
bootstrap();

