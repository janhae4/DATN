import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { TaskServiceModule } from './task-service.module';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { RpcExceptionFilter } from '@app/contracts/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(TaskServiceModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice(cfg.taskClientOptions as MicroserviceOptions);
  app.useGlobalFilters(new RpcExceptionFilter());
  await app.startAllMicroservices();
}
bootstrap();
