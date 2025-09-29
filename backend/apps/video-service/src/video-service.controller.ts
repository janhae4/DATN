import { Controller, Get } from '@nestjs/common';
import { VideoServiceService } from './video-service.service';

@Controller()
export class VideoServiceController {
  constructor(private readonly videoServiceService: VideoServiceService) {}

  @Get()
  getHello(): string {
    return this.videoServiceService.getHello();
  }
}
