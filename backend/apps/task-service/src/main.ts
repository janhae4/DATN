import { NestFactory } from '@nestjs/core';
import { TasksModule } from './tasks/tasks.module';
import { Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(TasksModule);
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.use(cookieParser())
  await app.init();
  await app.listen(3002);

  console.log('Task Service is running:');
  console.log('- HTTP (SSE): http://localhost:3002');
  console.log('- Microservice: Listening to RabbitMQ');
}
bootstrap();