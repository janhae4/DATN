import { NestFactory } from '@nestjs/core';
import { ChatbotModule } from './chatbot.module';
import cookieParser from 'cookie-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(ChatbotModule);
  const cfg = app.get(ClientConfigService);
  app.connectMicroservice(cfg.chatbotClientOptions as MicroserviceOptions);
  app.useWebSocketAdapter(new IoAdapter(app))
  app.use(cookieParser())
  await app.startAllMicroservices();
  await app.listen(3006);
}
bootstrap();
