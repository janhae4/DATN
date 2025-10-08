import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { TaskServiceModule } from './task-service.module';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { RpcExceptionFilter } from '@app/contracts/rcp-exception.filter';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(ClientConfigModule);
  const cfg = appCtx.get(ClientConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TaskServiceModule,
    cfg.taskClientOptions as MicroserviceOptions,
  );
  app.useGlobalFilters(new RpcExceptionFilter());
  await app.listen();
}
bootstrap();
