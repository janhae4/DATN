import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entity/notification.entity';
import { RmqClientService } from '@app/common';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: RmqClientService,
          useValue: {
            request: jest.fn(),
            publish: jest.fn(),
          }
        }
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
