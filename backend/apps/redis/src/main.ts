import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(ClientConfigModule);
  const cfg = appCtx.get(ClientConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RedisModule,
    cfg.redisClientOptions as MicroserviceOptions,
  );
  console.log(
    `Microservice Redis running on http://localhost:${process.env.REDIS_CLIENT_PORT}`,
  );
  await app.listen();
}
bootstrap();
