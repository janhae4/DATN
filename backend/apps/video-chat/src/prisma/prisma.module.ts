import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ClientConfigModule } from '@app/contracts';

@Global()
@Module({
  imports: [ClientConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
