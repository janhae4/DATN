import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
<<<<<<< HEAD
=======
import { UserController } from './user.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
>>>>>>> main

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
<<<<<<< HEAD
      providers: [UserService],
=======
      imports: [ClientConfigModule, ],
      controllers: [UserController],
      providers: [UserService, CLIENT_PROXY_PROVIDER.USER_CLIENT],
      exports: [UserService],
>>>>>>> main
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
