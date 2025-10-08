import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import cookieParser from 'cookie-parser';
import { RpcToHttpInterceptor } from './rpc-to-http.interceptor';
import { RefreshTokenInterceptor } from './refresh-token.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const config = new DocumentBuilder()
    .setTitle('DATN Project')
    .setDescription('The DATN API description')
    .setVersion('0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    app.get(RpcToHttpInterceptor),
    app.get(RefreshTokenInterceptor),
  );

  await app.listen(process.env.port ?? 3000);
}
bootstrap();
