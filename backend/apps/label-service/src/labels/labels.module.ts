import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from '@app/contracts/label/entity/label.entity';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
@Module({
  imports: [TypeOrmModule.forFeature([Label]), RabbitMQModule],
  controllers: [LabelsController],
  providers: [LabelsService],
  exports: [LabelsService],
})
export class LabelsModule {}
