import { NestFactory } from '@nestjs/core';
import { VideoServiceModule } from './video-service.module';

async function bootstrap() {
  const app = await NestFactory.create(VideoServiceModule, { cors: true });
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}
bootstrap();
