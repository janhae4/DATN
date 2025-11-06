import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LabelsService } from './labels.service';
import { CreateLabelDto, LABEL_PATTERNS, UpdateLabelDto } from '@app/contracts';

@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @MessagePattern(LABEL_PATTERNS.CREATE)
  create(@Payload() payload: { createLabelDto: CreateLabelDto; projectId: string }) {
    return this.labelsService.create(payload.createLabelDto, payload.projectId);
  }

  @MessagePattern(LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID)
  findAllByProject(@Payload() payload: { projectId: string }) {
    return this.labelsService.findAllByProject(payload.projectId);
  }

  @MessagePattern(LABEL_PATTERNS.FIND_ONE_BY_ID)
  findOne(@Payload() payload: { id: string }) {
    return this.labelsService.findOne(payload.id);
  }

  @MessagePattern(LABEL_PATTERNS.UPDATE)
  update(@Payload() payload: { id: string; updateLabelDto: UpdateLabelDto }) {
    return this.labelsService.update(payload.id, payload.updateLabelDto);
  }

  @MessagePattern(LABEL_PATTERNS.REMOVE)
  remove(@Payload() payload: { id: string }) {
    return this.labelsService.remove(payload.id);
  }
}
