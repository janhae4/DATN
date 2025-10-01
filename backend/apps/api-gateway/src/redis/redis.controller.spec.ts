import { Test, TestingModule } from '@nestjs/testing';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

describe('RedisController', () => {
  let controller: RedisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      controllers: [RedisController],
      providers: [RedisService, CLIENT_PROXY_PROVIDER.REDIS_CLIENT],
    }).compile();

    controller = module.get<RedisController>(RedisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
