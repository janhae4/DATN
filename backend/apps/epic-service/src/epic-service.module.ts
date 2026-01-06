import { Module } from '@nestjs/common';
import { ClientConfigModule } from '@app/contracts';
import { EpicsModule } from './epics/epics.module';

@Module({
  imports: [
    ClientConfigModule,
    EpicsModule, 
  ],
})
export class EpicServiceModule {}