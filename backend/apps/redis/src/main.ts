import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
async function bootstrap() {
  const app = await NestFactory.create(RedisModule);
  await app.init();
}
bootstrap();
