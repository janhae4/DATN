import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(RedisModule, {
    transport: Transport.REDIS,
    options: {
      port: 6379
    }
  });
  await app.listen();
}
bootstrap();
