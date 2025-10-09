import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

@Module({
  imports:[ClientConfigModule],
  controllers: [GmailController],
  providers: [GmailService],
})
export class GmailModule {}
