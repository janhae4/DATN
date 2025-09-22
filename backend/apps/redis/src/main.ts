import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RedisModule,
    {
      transport: Transport.REDIS,
      options: {
        port: Number(process.env.REDIS_CLIENT_PORT) || 6379,
      },
    },
  );
  console.log(`Microservice Redis running on http://localhost:${process.env.REDIS_CLIENT_PORT}`);
  await app.listen();
}
bootstrap();
