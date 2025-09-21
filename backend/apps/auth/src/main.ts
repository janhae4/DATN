import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        port: 3002,
      },
    },
  );
  await app.listen();
}
bootstrap();
