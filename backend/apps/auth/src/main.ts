import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { RpcResponseInterceptor } from '@app/common/interceptor/rpc-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.useGlobalInterceptors(new RpcResponseInterceptor())
  await app.init();
  console.log('Auth microservice is listening (RPC Mode)');
}
bootstrap();
