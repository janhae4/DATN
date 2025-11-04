import { NestFactory } from '@nestjs/core';
import { AiDiscussionModule } from './ai-discussion.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AiDiscussionModule);
  app.use(cookieParser());
  await app.init();
}
bootstrap();
