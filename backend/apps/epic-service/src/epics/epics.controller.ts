import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { EpicsService } from './epics.service';
import {
  CreateEpicDto,
  EPIC_EXCHANGE,
  EPIC_PATTERNS,
  UpdateEpicDto
} from '@app/contracts';

@Controller()
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) { }

  @RabbitRPC({
    exchange: EPIC_EXCHANGE,
    routingKey: EPIC_PATTERNS.CREATE,
    queue: EPIC_PATTERNS.CREATE,
  })
  create(payload: { createEpicDto: CreateEpicDto, userId: string }) {
    console.log("create epic request:", payload.createEpicDto);
    return this.epicsService.create(payload.createEpicDto, payload.userId);
  }

  @RabbitRPC({
    exchange: EPIC_EXCHANGE,
    routingKey: EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    queue: EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID,
  })
  findAllByProject(payload: { projectId: string; userId: string }) {
    return this.epicsService.findAllByProject(payload.projectId, payload.userId);
  }

  @RabbitRPC({
    exchange: EPIC_EXCHANGE,
    routingKey: EPIC_PATTERNS.FIND_ONE_BY_ID,
    queue: EPIC_PATTERNS.FIND_ONE_BY_ID,
  })
  findOne(payload: { epicId: string }) {
    return this.epicsService.findOne(payload.epicId);
  }

  @RabbitRPC({
    exchange: EPIC_EXCHANGE,
    routingKey: EPIC_PATTERNS.UPDATE,
    queue: EPIC_PATTERNS.UPDATE,
  })
  update(payload: { epicId: string; updateEpicDto: UpdateEpicDto }) {
    return this.epicsService.update(payload.epicId, payload.updateEpicDto);
  }

  @RabbitRPC({
    exchange: EPIC_EXCHANGE,
    routingKey: EPIC_PATTERNS.REMOVE,
    queue: EPIC_PATTERNS.REMOVE,
  })
  remove(payload: { epicId: string }) {
    return this.epicsService.remove(payload.epicId);
  }
}