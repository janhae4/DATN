import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { EpicsService } from './epics.service';
import { CreateEpicDto, EPIC_PATTERNS, UpdateEpicDto } from '@app/contracts';
import { customErrorHandler } from '@app/common';

@Controller()
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  @RabbitRPC({
    exchange: 'epic_exchange',
    routingKey: EPIC_PATTERNS.CREATE,
    queue: EPIC_PATTERNS.CREATE,
    errorHandler: customErrorHandler,
  })
  create(createEpicDto: CreateEpicDto) {
    return this.epicsService.create(createEpicDto);
  }

  @RabbitRPC({
    exchange: 'epic_exchange',
    routingKey: EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    queue: EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    errorHandler: customErrorHandler,
  })
  findAllByProject(payload: { projectId: string }) {
    return this.epicsService.findAllByProject(payload.projectId);
  }

  @RabbitRPC({
    exchange: 'epic_exchange',
    routingKey: EPIC_PATTERNS.FIND_ONE_BY_ID,
    queue: EPIC_PATTERNS.FIND_ONE_BY_ID,
    errorHandler: customErrorHandler,
  })
  findOne(payload: { epicId: string }) {
    return this.epicsService.findOne(payload.epicId);
  }

  @RabbitRPC({
    exchange: 'epic_exchange',
    routingKey: EPIC_PATTERNS.UPDATE,
    queue: EPIC_PATTERNS.UPDATE,
    errorHandler: customErrorHandler,
  })
  update(payload: { epicId: string; updateEpicDto: UpdateEpicDto }) {
    return this.epicsService.update(payload.epicId, payload.updateEpicDto);
  }

  @RabbitRPC({
    exchange: 'epic_exchange',
    routingKey: EPIC_PATTERNS.REMOVE,
    queue: EPIC_PATTERNS.REMOVE,
    errorHandler: customErrorHandler,
  })
  remove(payload: { epicId: string }) {
    return this.epicsService.remove(payload.epicId);
  }
}