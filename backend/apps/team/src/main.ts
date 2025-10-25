import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { TeamModule } from './team/team.module';
import { ClientConfigService } from '@app/contracts';

async function bootstrap() {
  const app = await NestFactory.create(TeamModule);
  await app.init();
}
bootstrap();
