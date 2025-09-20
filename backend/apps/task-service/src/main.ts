import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { TaskServiceModule } from './task-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(TaskServiceModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0', 
      port: 3002,     
    },
  });

  await app.listen();
}
bootstrap();
