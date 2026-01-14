import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ProjectServiceModule } from './project-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ProjectServiceModule);
  await app.init()
  Logger.log('Project Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();
