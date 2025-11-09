import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EpicsService } from './epics.service';
import { CreateEpicDto, EPIC_PATTERNS, UpdateEpicDto } from '@app/contracts';
@Controller()
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  @MessagePattern(EPIC_PATTERNS.CREATE)
  create(@Payload() payload: { createEpicDto: CreateEpicDto;}) {
    return this.epicsService.create(payload.createEpicDto);
  }

  @MessagePattern(EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID)
  findAllByProject(@Payload() payload: { projectId: string }) {
    return this.epicsService.findAllByProject(payload.projectId);
  }

  @MessagePattern(EPIC_PATTERNS.FIND_ONE_BY_ID)
  findOne(@Payload() payload: { epicId: string }) {
    return this.epicsService.findOne(payload.epicId);
  }

  @MessagePattern(EPIC_PATTERNS.UPDATE)
  update(@Payload() payload: { epicId: string; updateEpicDto: UpdateEpicDto }) {
    return this.epicsService.update(payload.epicId, payload.updateEpicDto);
  }

  @MessagePattern(EPIC_PATTERNS.REMOVE)
  remove(@Payload() payload: { epicId: string }) {
    return this.epicsService.remove(payload.epicId);
  }
}
