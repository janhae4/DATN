import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './adapter/redis-io.adapter';
import { NotificationModule } from './notification/notification.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ClientConfigService } from '@app/contracts';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice<MicroserviceOptions>(
    cfg.notificationClientOptions as MicroserviceOptions,
  );
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.startAllMicroservices();
  await app.listen(Number(process.env.NOTIFICATION_CLIENT_PORT) || 4001);
  console.log(`API Gateway running on http://localhost:4001`);
}
bootstrap();
