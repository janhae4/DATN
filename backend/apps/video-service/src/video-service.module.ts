import { Module } from '@nestjs/common';
import { VideoServiceController } from './video-service.controller';
import { VideoServiceService } from './video-service.service';

@Module({
  imports: [],
  controllers: [VideoServiceController],
  providers: [VideoServiceService],
})
export class VideoServiceModule {}
