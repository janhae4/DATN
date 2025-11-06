import { NestFactory } from '@nestjs/core';
<<<<<<< HEAD
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
=======
import { MicroserviceOptions } from '@nestjs/microservices';
import { TaskServiceModule } from './task-service.module';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { RpcExceptionFilter } from '@app/contracts/rcp-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(TaskServiceModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice(cfg.taskClientOptions as MicroserviceOptions);
  app.useGlobalFilters(new RpcExceptionFilter());
  await app.startAllMicroservices();
>>>>>>> frontend/feature/backlogs
}
bootstrap();
