import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { TaskServiceModule } from './task-service.module';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(TaskServiceModule);
  const cfg = appCtx.get(ClientConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TaskServiceModule,
    cfg.taskClientOptions as MicroserviceOptions,
  );
  await app.listen();
}
bootstrap();
