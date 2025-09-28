import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
ConfigModule.forRoot();
async function bootstrap() {
  const appCtx = await NestFactory.createApplicationContext(UserModule);
  const cfg = appCtx.get(ClientConfigService);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    cfg.userClientOptions
  );
  console.log(`Microservice  running on http://localhost:${process.env.USER_CLIENT_PORT}`);
  await app.listen();
}
bootstrap();
