import { NestFactory } from '@nestjs/core';
import { BoardModule } from './board/board.module';

async function bootstrap() {
  const app = await NestFactory.create(BoardModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
