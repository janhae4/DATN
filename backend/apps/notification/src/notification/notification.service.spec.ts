import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from './prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      providers: [NotificationGateway, NotificationService, PrismaService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
