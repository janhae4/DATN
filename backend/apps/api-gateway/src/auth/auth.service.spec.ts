import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule, UserModule],
      controllers: [AuthController],
      providers: [AuthService],
      exports: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
