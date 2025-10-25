import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import cookieParser from 'cookie-parser';
import { RoleGuard } from './common/role/role.guard';
import { RpcToHttpExceptionFilter } from './common/filter/rpc-to-http.filter';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableCors({
    origin: [
      'http://localhost:5000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

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
  app.useGlobalGuards(app.get(RoleGuard));
  app.useGlobalFilters(app.get(RpcToHttpExceptionFilter));
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
