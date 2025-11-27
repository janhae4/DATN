import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { LabelsService } from './labels.service';
import { CreateLabelDto, LABEL_PATTERNS, UpdateLabelDto } from '@app/contracts';

@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @MessagePattern(LABEL_PATTERNS.CREATE)
  create(createLabelDto: CreateLabelDto) {
    return this.labelsService.create(createLabelDto);
  }

  @MessagePattern(LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID)
  findAllByProject(payload: { projectId: string }) {
    return this.labelsService.findAllByProject(payload.projectId);
  }

  @MessagePattern(LABEL_PATTERNS.FIND_ONE_BY_ID)
  findOne(payload: { id: string }) {
    return this.labelsService.findOne(payload.id);
  }

  @MessagePattern(LABEL_PATTERNS.UPDATE)
  update(payload: { id: string; updateLabelDto: UpdateLabelDto }) {
    return this.labelsService.update(payload.id, payload.updateLabelDto);
  }

  @MessagePattern(LABEL_PATTERNS.REMOVE)
  remove(payload: { id: string }) {
    return this.labelsService.remove(payload.id);
  }
}