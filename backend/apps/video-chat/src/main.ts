import { NestFactory } from '@nestjs/core';
import { VideoChatModule } from './video-chat/video-chat.module';

async function bootstrap() {
  const app = await NestFactory.create(VideoChatModule);
  await app.listen(3004);

  console.log('VideoChat HTTP server is listening on port 3004');
  console.log(
    'VideoChat microservice is listening: 3004',
  );
}
bootstrap();
