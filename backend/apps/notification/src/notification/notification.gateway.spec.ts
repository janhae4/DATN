import { Test, TestingModule } from '@nestjs/testing';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { NotificationController } from './notification.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entity/notification.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      providers: [
        NotificationGateway,
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
          provide: AmqpConnection,
          useValue: {
            request: jest.fn(),
          }
        }
      ],
      controllers: [NotificationController],
      exports: [NotificationService],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
