import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
ConfigModule.forRoot();
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.TCP,
      options: {
        port:  Number(process.env.USER_CLIENT_PORT) || 3001
      },
    },
  );
  console.log(`Microservice User running on http://localhost:${process.env.USER_CLIENT_PORT}`);
  await app.listen();
}
bootstrap();
