import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotGateway } from './chatbot.gateway';

describe('ChatbotGateway', () => {
  let gateway: ChatbotGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatbotGateway],
    }).compile();

    gateway = module.get<ChatbotGateway>(ChatbotGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
