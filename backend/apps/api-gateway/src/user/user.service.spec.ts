import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { UserController } from './user.controller';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      controllers: [UserController],
      providers: [UserService, CLIENT_PROXY_PROVIDER.USER_CLIENT],
      exports: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
