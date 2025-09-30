import { Module } from '@nestjs/common';
import { VideoServiceController } from './video-service.controller';
import { VideoServiceService } from './video-service.service';
import { SignalingGateway } from './signaling.gateway';

@Module({
  imports: [],
  controllers: [VideoServiceController],
  providers: [VideoServiceService, SignalingGateway],
})
export class VideoServiceModule {}
