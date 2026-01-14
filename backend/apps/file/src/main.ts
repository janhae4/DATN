import { NestFactory } from '@nestjs/core';
import { FileModule } from './file/file.module';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(FileModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();
}
bootstrap();

