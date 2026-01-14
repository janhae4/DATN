import { forwardRef, Module } from '@nestjs/common';
import { GmailGatewayController } from './gmail.controller';
import { GmailGatewayService } from './gmail.service';
import { AuthModule } from '../auth/auth.module';
import { ClientConfigModule } from '@app/contracts';

@Module({
    imports: [
        forwardRef(() => AuthModule),
        ClientConfigModule,
    ],
    controllers: [GmailGatewayController],
    providers: [GmailGatewayService],
})
export class GmailModule { }
