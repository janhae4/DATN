import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { JwtAuthGuard } from '@app/contracts/auth/jwt/jwt-auth.guard';
import { JwtStrategy } from '@app/contracts/auth/jwt/jwt.strategy';

@Module({
  imports: [ClientConfigModule],
  controllers: [GmailController],
  providers: [GmailService, CLIENT_PROXY_PROVIDER.GMAIL_CLIENT, JwtAuthGuard, JwtStrategy ],
})
export class GmailModule {}
