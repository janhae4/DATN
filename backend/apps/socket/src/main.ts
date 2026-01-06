import { NestFactory } from '@nestjs/core';
import { ClientConfigService } from '@app/contracts';
import { SocketModule } from './socket.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(SocketModule);
  const cfg = app.get(ClientConfigService);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(Number(cfg.getSocketPort()) || 4001);
  console.log(`API Gateway running on http://localhost:4001`);
}
bootstrap();
