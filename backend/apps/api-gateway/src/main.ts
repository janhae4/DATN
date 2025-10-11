import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway/api-gateway.module';
import cookieParser from 'cookie-parser';
import { RoleGuard } from './common/role/role.guard';
import { RefreshTokenFilter } from './common/filter/refresh-token.filter';
import { RpcToHttpExceptionFilter } from './common/filter/rpc-to-http.filter';
import { Request, Response } from 'express';

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
  app.useGlobalGuards(app.get(RoleGuard));
  app.useGlobalFilters(
    app.get(RefreshTokenFilter),
    app.get(RpcToHttpExceptionFilter),
  );

  app.use((req: Request, res: Response, next: () => void) => {
    if (req.url.startsWith('/.well-known')) {
      return res.status(204).send();
    }
    next();
  });

  await app.listen(process.env.port ?? 3000);
}
bootstrap();
