import { Test, TestingModule } from '@nestjs/testing';
import { TestingServiceController } from './testing-service.controller';
import { TestingServiceService } from './testing-service.service';

describe('TestingServiceController', () => {
  let testingServiceController: TestingServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TestingServiceController],
      providers: [TestingServiceService],
    }).compile();

    testingServiceController = app.get<TestingServiceController>(TestingServiceController);
  });


});
