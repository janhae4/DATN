import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';

async function bootstrap() {
  const app = await NestFactory.create(RedisModule);
  // RabbitMQModule is already configured in RedisModule
  // It will automatically handle RabbitMQ connections
  await app.listen(3006); // Add HTTP endpoint for health checks
  console.log('Redis microservice is running and listening for RabbitMQ messages on port 3006');
}
bootstrap();

