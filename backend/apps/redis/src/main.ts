import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';

async function bootstrap() {
  const app = await NestFactory.create(RedisModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice(cfg.redisClientOptions as MicroserviceOptions);
  await app.startAllMicroservices();
}
bootstrap();
