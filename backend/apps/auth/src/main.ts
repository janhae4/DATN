import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';

async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(AuthModule);
  const cfg = appCtx.get(ClientConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    cfg.authClientOptions
  );
  console.log(`Microservice Auth running on http://localhost:${process.env.AUTH_CLIENT_PORT}`);
  await app.listen();
}
bootstrap();
