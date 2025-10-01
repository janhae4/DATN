import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
<<<<<<< HEAD
=======
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { AuthController } from './auth.controller';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
>>>>>>> main

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
<<<<<<< HEAD
      providers: [AuthService],
=======
      imports: [
          PassportModule,
          JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '60s' },
          }),
          ClientConfigModule,
        ],
        controllers: [AuthController],
        providers: [
          AuthService,
          CLIENT_PROXY_PROVIDER.USER_CLIENT,
          CLIENT_PROXY_PROVIDER.NOTIFICATION_CLIENT,
          CLIENT_PROXY_PROVIDER.REDIS_CLIENT,
        ],
>>>>>>> main
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
