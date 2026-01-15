import { Test, TestingModule } from '@nestjs/testing';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
    let controller: AuthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ClientConfigModule, UserModule],
            controllers: [AuthController]
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
