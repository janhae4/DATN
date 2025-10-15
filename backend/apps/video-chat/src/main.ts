import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { VideoChatModule } from './video-chat/video-chat.module';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';

async function bootstrap() {
  const app = await NestFactory.create(VideoChatModule);

  // Lấy ClientConfigService để cấu hình
  const cfg = app.get(ClientConfigService);

  // Kết nối microservice với RabbitMQ
  app.connectMicroservice(cfg.videoChatClientOptions as MicroserviceOptions);

  // Khởi động cả HTTP server (cho Socket.IO) và microservice
  await app.startAllMicroservices();
  await app.listen(3004); // HTTP server cho Socket.IO

  console.log('VideoChat HTTP server is listening on port 3004');
  console.log(
    'VideoChat microservice is listening',
    cfg.getVideoChatClientPort(),
  );
}
bootstrap();
