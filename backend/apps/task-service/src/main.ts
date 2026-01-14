import { NestFactory } from '@nestjs/core';
import { TasksModule } from './tasks/tasks.module';
import cookieParser from 'cookie-parser';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(TasksModule);
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  app.use(cookieParser())
  await app.init();
}
bootstrap();