import { NestFactory } from '@nestjs/core';
import { TeamModule } from './team/team.module';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(TeamModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

bootstrap();
