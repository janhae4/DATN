import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';

async function bootstrap() {
  const app = await NestFactory.create(ProjectsModule);
  await app.init()
  Logger.log('Project Service is listening RabbitMQ messages...', 'Bootstrap');
}
bootstrap();
