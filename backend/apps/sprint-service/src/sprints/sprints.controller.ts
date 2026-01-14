import { Controller } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import {
  CreateSprintDto,
  SPRINT_EXCHANGE,
  SPRINT_PATTERNS,
  SprintStatus,
  UpdateSprintDto
} from '@app/contracts';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';
@Controller()
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) { }

  @RabbitRPC({
    exchange: SPRINT_EXCHANGE,
    routingKey: SPRINT_PATTERNS.CREATE,
    queue: SPRINT_PATTERNS.CREATE,
    errorHandler: customErrorHandler,
  })
  create(createSprintDto: CreateSprintDto) {
    return this.sprintsService.create(createSprintDto);
  }

  @RabbitRPC({
    exchange: SPRINT_EXCHANGE,
    routingKey: SPRINT_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    queue: SPRINT_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    errorHandler: customErrorHandler,
  })
  findAllByProjectId(payload: { projectId: string }) {
    return this.sprintsService.findAllByProjectId(payload.projectId);
  }

  @RabbitRPC({
    exchange: SPRINT_EXCHANGE,
    routingKey: SPRINT_PATTERNS.FIND_ONE_BY_ID,
    queue: SPRINT_PATTERNS.FIND_ONE_BY_ID,
    errorHandler: customErrorHandler,
  })
  findOneById(payload: { id: string; userId: string }) {
    return this.sprintsService.findOneById(payload.id);
  }

  @RabbitRPC({
    exchange: SPRINT_EXCHANGE,
    routingKey: SPRINT_PATTERNS.FIND_ALL,
    queue: SPRINT_PATTERNS.FIND_ALL,
    errorHandler: customErrorHandler,
  })
  findAll(payload: { projectId: string; status?: SprintStatus[]; userId: string, teamId: string }) {
    return this.sprintsService.findAll(payload.projectId, payload.userId, payload.teamId, payload.status);
  }

  @RabbitRPC({
    exchange: SPRINT_EXCHANGE,
    routingKey: SPRINT_PATTERNS.UPDATE,
    queue: SPRINT_PATTERNS.UPDATE,
    errorHandler: customErrorHandler,
  })
  update(payload: { id: string; updateSprintDto: UpdateSprintDto; userId: string }) {
    return this.sprintsService.update(payload.id, payload.updateSprintDto);
  }

  @RabbitRPC({
    exchange: SPRINT_EXCHANGE,
    routingKey: SPRINT_PATTERNS.REMOVE,
    queue: SPRINT_PATTERNS.REMOVE,
    errorHandler: customErrorHandler,
  })
  remove(payload: { id: string; userId: string }) {
    return this.sprintsService.remove(payload.id);
  }
}