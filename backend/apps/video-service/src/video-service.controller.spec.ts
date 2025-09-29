import { Test, TestingModule } from '@nestjs/testing';
import { VideoServiceController } from './video-service.controller';
import { VideoServiceService } from './video-service.service';

describe('VideoServiceController', () => {
  let videoServiceController: VideoServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [VideoServiceController],
      providers: [VideoServiceService],
    }).compile();

    videoServiceController = app.get<VideoServiceController>(VideoServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(videoServiceController.getHello()).toBe('Hello World!');
    });
  });
});
