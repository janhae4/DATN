import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { UserModule } from './user/user.module';
import { ClientConfigService } from '@app/contracts';
async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice(cfg.userClientOptions as MicroserviceOptions);
  await app.startAllMicroservices();
}
bootstrap();
