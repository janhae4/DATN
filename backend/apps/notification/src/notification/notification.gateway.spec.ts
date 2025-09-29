import { Test, TestingModule } from '@nestjs/testing';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { PrismaService } from './prisma.service';
import { NotificationController } from './notification.controller';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      providers: [NotificationGateway, NotificationService, PrismaService],
      controllers: [NotificationController],
      exports: [NotificationService],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
