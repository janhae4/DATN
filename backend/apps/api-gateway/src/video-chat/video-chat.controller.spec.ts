import { Test, TestingModule } from '@nestjs/testing';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';

describe('VideoChatController', () => {
  let controller: VideoChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoChatController],
      providers: [VideoChatService],
    }).compile();

    controller = module.get<VideoChatController>(VideoChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
