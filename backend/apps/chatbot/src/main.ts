import { NestFactory } from '@nestjs/core';
import { ChatbotModule } from './ai-discussion.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(ChatbotModule);
  app.use(cookieParser());
  await app.init();
}
bootstrap();
