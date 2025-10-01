import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
<<<<<<< HEAD
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RedisModule,
    {
      transport: Transport.REDIS,
      options: {
        port: 6379,
      },
    },
=======
import { MicroserviceOptions } from '@nestjs/microservices';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(RedisModule);
  const cfg = appCtx.get(ClientConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RedisModule,
    cfg.redisClientOptions as MicroserviceOptions,
  );
  console.log(
    `Microservice Redis running on http://localhost:${process.env.REDIS_CLIENT_PORT}`,
>>>>>>> main
  );
  await app.listen();
}
bootstrap();
