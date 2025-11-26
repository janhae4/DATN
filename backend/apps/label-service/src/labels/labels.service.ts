import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateLabelDto, UpdateLabelDto } from '@app/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from '@app/contracts/label/entity/label.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE } from '@app/contracts/constants';
import { LabelEvent } from '@app/contracts/events/label.event';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  create(createLabelDto: CreateLabelDto) {
    if (!createLabelDto) {
      throw new BadRequestException('CreateLabelDto is required');
    }
    if (!createLabelDto.name) {
      throw new BadRequestException('Label name is required');
    }
    if (!createLabelDto.projectId) {
      throw new BadRequestException('Project ID is required');
    }

    const label = this.labelRepository.create({
      name: createLabelDto.name,
      projectId: createLabelDto.projectId,
      color: createLabelDto.color || '#EFE9E3',
    });

    return this.labelRepository.save(label);
  }

  findAllByProject(projectId: string) {
    return this.labelRepository.find({
      where: { projectId },
      order: { name: 'ASC' },
    });
  }

  findOne(id: string) {
    return this.labelRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateLabelDto: UpdateLabelDto) {
    const label = await this.labelRepository.findOne({ where: { id } });
    if (!label) {
      throw new BadRequestException('Label not found');
    }

    Object.assign(label, updateLabelDto);
    const updatedLabel = await this.labelRepository.save(label);

    this.amqpConnection.publish(
      EVENTS_EXCHANGE,
      LabelEvent.UPDATED,
      updatedLabel,
    );

    return updatedLabel;
  }

  async remove(id: string) {
    const result = await this.labelRepository.delete(id);
    if (result.affected && result.affected > 0) {
      this.amqpConnection.publish(EVENTS_EXCHANGE, LabelEvent.DELETED, { id });
    }
    return result;
  }
}
