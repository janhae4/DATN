import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { TeamModule } from './team/team.module';
import { ClientConfigService } from '@app/contracts';

async function bootstrap() {
  const app = await NestFactory.create(TeamModule);
  const cfg = app.get(ClientConfigService)
  app.connectMicroservice(cfg.teamClientOptions as MicroserviceOptions)
  await app.startAllMicroservices();
}
bootstrap();
