import { NestFactory } from '@nestjs/core';
import { DiscussionModule } from './discussion/discussion.module';

async function bootstrap() {
  const app = await NestFactory.create(DiscussionModule);
  await app.init()
}
bootstrap();
