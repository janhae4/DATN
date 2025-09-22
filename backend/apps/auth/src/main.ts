import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        port: Number(process.env.AUTH_CLIENT_PORT || 3001),
      },
    },
  );
  console.log(`Microservice Auth running on http://localhost:${process.env.AUTH_CLIENT_PORT}`);
  await app.listen();
}
bootstrap();
