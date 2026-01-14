import { NestFactory } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { RpcResponseInterceptor } from '@app/common';
async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor());
  await app.init();
}
bootstrap();
