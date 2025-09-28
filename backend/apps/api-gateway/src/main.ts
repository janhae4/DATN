import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';
import cookieParser from 'cookie-parser';

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
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
