import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
<<<<<<< HEAD
=======
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
>>>>>>> main

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
<<<<<<< HEAD
      controllers: [UserController],
      providers: [UserService],
=======
      imports: [ClientConfigModule],
      controllers: [UserController],
      providers: [UserService, CLIENT_PROXY_PROVIDER.USER_CLIENT],
      exports: [UserService],
>>>>>>> main
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
