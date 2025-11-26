import { NestFactory } from '@nestjs/core';
import { ProjectServiceModule } from './project-service.module'; 

async function bootstrap() {
  const app = await NestFactory.create(ProjectServiceModule);
  await app.init();
  console.log('Project microservice is listening (RPC Mode via golevelup)');
}
bootstrap();