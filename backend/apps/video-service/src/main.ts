import { NestFactory } from '@nestjs/core';
import { VideoServiceModule } from './video-service.module';

async function bootstrap() {
  const app = await NestFactory.create(VideoServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
