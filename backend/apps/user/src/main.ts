import { NestFactory } from '@nestjs/core';
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
  );
  await app.listen();
}
bootstrap();
