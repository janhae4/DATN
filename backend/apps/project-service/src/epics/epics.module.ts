import { Module } from '@nestjs/common';
import { EpicsService } from './epics.service';
import { EpicsController } from './epics.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EpicsController],
  providers: [EpicsService],
  exports: [EpicsService],
})
export class EpicsModule {}
