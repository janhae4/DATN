import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { VideoChatModule } from './video-chat/video-chat.module';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';

async function bootstrap() {
  const app = await NestFactory.create(VideoChatModule);

  const cfg = app.get(ClientConfigService);

  app.connectMicroservice(cfg.videoChatClientOptions as MicroserviceOptions);

  await app.startAllMicroservices();
  await app.listen(3004); 

  console.log('VideoChat HTTP server is listening on port 3004');
  console.log(
    'VideoChat microservice is listening',
    cfg.getVideoChatClientPort(),
  );
}
bootstrap();
