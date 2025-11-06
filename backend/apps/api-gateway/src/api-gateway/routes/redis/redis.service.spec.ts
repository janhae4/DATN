import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { RedisController } from './redis.controller';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      controllers: [RedisController],
      providers: [RedisService, CLIENT_PROXY_PROVIDER.REDIS_CLIENT],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
