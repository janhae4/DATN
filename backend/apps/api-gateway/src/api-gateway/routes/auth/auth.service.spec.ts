import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule, UserModule],
      controllers: [AuthController],
      providers: [AuthService, CLIENT_PROXY_PROVIDER.AUTH_CLIENT],
      exports: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
