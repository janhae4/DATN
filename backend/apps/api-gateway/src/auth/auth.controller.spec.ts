import { Test, TestingModule } from '@nestjs/testing';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

describe('AuthController', () => {
    let controller: AuthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ClientConfigModule, UserModule],
            controllers: [AuthController],
            providers: [AuthService, CLIENT_PROXY_PROVIDER.AUTH_CLIENT],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
