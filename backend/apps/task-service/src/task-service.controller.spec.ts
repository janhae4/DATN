import { Test, TestingModule } from '@nestjs/testing';
import { TaskServiceController } from './task-service.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TaskServiceService } from './task-service.service';

describe('TaskServiceController', () => {
  let controller: TaskServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [TaskServiceController],
      providers: [TaskServiceService],
    }).compile();

    controller = module.get<TaskServiceController>(TaskServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  })
});
