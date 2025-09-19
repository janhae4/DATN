import { Test, TestingModule } from '@nestjs/testing';
import { ClientConfigService } from './client-config.service';

describe('ClientConfigService', () => {
  let service: ClientConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientConfigService],
    }).compile();

    service = module.get<ClientConfigService>(ClientConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
