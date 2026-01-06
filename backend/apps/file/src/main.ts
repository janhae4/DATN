import { NestFactory } from '@nestjs/core';
import { FileModule } from './file/file.module';

async function bootstrap() {
  const app = await NestFactory.create(FileModule);
  await app.init();
}
bootstrap();

