import { NestFactory } from '@nestjs/core';
<<<<<<< HEAD
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserModule } from './user/user.module';
import { USER_CLIENT_PORT } from '@app/contracts/constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.TCP,
      options: {
        port: USER_CLIENT_PORT,
      },
    },
=======
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
    cfg.userClientOptions as MicroserviceOptions,
  );
  console.log(
    `Microservice  running on http://localhost:${process.env.USER_CLIENT_PORT}`,
>>>>>>> main
  );
  await app.listen();
}
bootstrap();
