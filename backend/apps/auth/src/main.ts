import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { RpcExceptionFilter } from '@app/contracts/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const cfg = app.get(ClientConfigService);

  app.connectMicroservice(cfg.authClientOptions as MicroserviceOptions);

  app.useGlobalFilters(new RpcExceptionFilter());
  await app.startAllMicroservices();
}
bootstrap();
