import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  app.use(cookieParser())
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
