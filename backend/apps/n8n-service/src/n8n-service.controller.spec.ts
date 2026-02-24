import { Test, TestingModule } from '@nestjs/testing';
import { N8nServiceController } from './n8n-service.controller';
import { N8nServiceService } from './n8n-service.service';

describe('N8nServiceController', () => {
  let n8nServiceController: N8nServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [N8nServiceController],
      providers: [N8nServiceService],
    }).compile();

    n8nServiceController = app.get<N8nServiceController>(N8nServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(n8nServiceController.getHello()).toBe('Hello World!');
    });
  });
});
