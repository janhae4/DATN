import { NestFactory } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
async function bootstrap() {
  const app = await NestFactory.create(ChatModule);
  await app.init()
}
bootstrap();
