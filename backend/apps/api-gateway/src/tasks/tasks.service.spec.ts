import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { TasksController } from './tasks.controller';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      controllers: [TasksController],
      providers: [TasksService, CLIENT_PROXY_PROVIDER.TASK_CLIENT],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
