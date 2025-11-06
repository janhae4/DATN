import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ProjectServiceModule } from './project-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ProjectServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RMQ_URL],
      queue: process.env.PROJECT_SERVICE_QUEUE,
      queueOptions: {
        durable: false,
      },
    },
  });

  // Áp dụng ValidationPipe để DTOs từ @contracts hoạt động
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen();
  console.log('Project microservice is listening');
}
bootstrap();
