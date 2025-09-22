import { NestFactory } from '@nestjs/core';
import { RedisIoAdapter } from './adapter/redis-io.adapter';
import { NotificationModule } from './notification/notification.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: 'localhost',
      port: 6379,
     },
  });

  await app.startAllMicroservices();
  await app.listen(Number(process.env.NOTIFICATION_CLIENT_PORT) || 4001);
  console.log(`API Gateway running on http://localhost:4001`);
}
bootstrap();
