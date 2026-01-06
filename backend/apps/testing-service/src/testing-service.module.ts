import { Module } from '@nestjs/common';
import { TestingServiceController } from './testing-service.controller';
import { TestingServiceService } from './testing-service.service';
import { ClientConfigModule } from '@app/contracts';

@Module({
  imports: [ ClientConfigModule],
  controllers: [TestingServiceController],
  providers: [TestingServiceService],
})
export class TestingServiceModule {}
