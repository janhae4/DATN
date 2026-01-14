import { NestFactory } from '@nestjs/core';
import { CalendarModule } from './calendar-service.module';
import { RpcResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(CalendarModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();
}
bootstrap();