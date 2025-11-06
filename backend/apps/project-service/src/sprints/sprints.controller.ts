import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SprintsService } from './sprints.service';
import { CreateSprintDto, SPRINT_PATTERNS, UpdateSprintDto } from '@app/contracts';

@Controller()
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @MessagePattern(SPRINT_PATTERNS.CREATE)
  create(@Payload() payload: { createSprintDto: CreateSprintDto; userId: string }) {
    return this.sprintsService.create(payload.createSprintDto, payload.userId);
  }

  @MessagePattern(SPRINT_PATTERNS.FIND_ALL_BY_PROJECT_ID)
  findAllByProjectId(@Payload() payload: { projectId: string; userId: string }) {
    return this.sprintsService.findAllByProjectId(payload.projectId, payload.userId);
  }

  @MessagePattern(SPRINT_PATTERNS.FIND_ONE_BY_ID)
  findOneById(@Payload() payload: { id: string; userId: string }) {
    return this.sprintsService.findOneById(payload.id, payload.userId);
  }

  @MessagePattern(SPRINT_PATTERNS.UPDATE)
  update(
    @Payload()
    payload: {
      id: string;
      updateSprintDto: UpdateSprintDto;
      userId: string;
    },
  ) {
    return this.sprintsService.update(
      payload.id,
      payload.updateSprintDto,
      payload.userId,
    );
  }

  @MessagePattern(SPRINT_PATTERNS.REMOVE)
  remove(@Payload() payload: { id: string; userId: string }) {
    return this.sprintsService.remove(payload.id, payload.userId);
  }

  @MessagePattern(SPRINT_PATTERNS.GET_ACTIVE_SPRINT)
  getActiveSprint(@Payload() payload: { projectId: string; userId: string }) {
    return this.sprintsService.getActiveSprint(payload.projectId, payload.userId);
  }

  @MessagePattern(SPRINT_PATTERNS.START_SPRINT)
  startSprint(@Payload() payload: { id: string; userId: string }) {
    return this.sprintsService.startSprint(payload.id, payload.userId);
  }
}
