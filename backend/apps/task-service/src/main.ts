import { NestFactory } from '@nestjs/core';
import { TasksModule } from './tasks/tasks.module';

async function bootstrap() {
  const app = await NestFactory.create(TasksModule);
  await app.init(); // Tự động connect qua RabbitMQModule
  console.log('Task microservice is listening (RPC Mode)');
}
bootstrap();