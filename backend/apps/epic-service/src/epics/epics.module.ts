import { Module } from '@nestjs/common';
import { EpicsService } from './epics.service';
import { EpicsController } from './epics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Epic } from '../entities/epic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Epic])],
  controllers: [EpicsController],
  providers: [EpicsService],
  exports: [EpicsService],
})
export class EpicsModule {}
