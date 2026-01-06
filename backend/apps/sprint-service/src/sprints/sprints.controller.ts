import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { SprintsService } from './sprints.service';
import { CreateSprintDto, SPRINT_PATTERNS, SprintStatus, UpdateSprintDto } from '@app/contracts';

@Controller()
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) { }

  @MessagePattern(SPRINT_PATTERNS.CREATE)
  create(createSprintDto: CreateSprintDto) {
    return this.sprintsService.create(createSprintDto);
  }

  @MessagePattern(SPRINT_PATTERNS.FIND_ALL_BY_PROJECT_ID)
  findAllByProjectId(payload: { projectId: string }) {
    return this.sprintsService.findAllByProjectId(payload.projectId);
  }

  @MessagePattern(SPRINT_PATTERNS.FIND_ONE_BY_ID)
  findOneById(payload: { id: string; userId: string }) {
    return this.sprintsService.findOneById(payload.id);
  }

  @MessagePattern(SPRINT_PATTERNS.FIND_ALL)
  findAll(payload: { projectId: string; status?: SprintStatus[]; userId: string, teamId: string }) {
    return this.sprintsService.findAll(payload.projectId, payload.userId, payload.teamId, payload.status);
  }

  @MessagePattern(SPRINT_PATTERNS.UPDATE)
  update(payload: { id: string; updateSprintDto: UpdateSprintDto; userId: string }) {
    return this.sprintsService.update(payload.id, payload.updateSprintDto);
  }

  @MessagePattern(SPRINT_PATTERNS.REMOVE)
  remove(payload: { id: string; userId: string }) {
    return this.sprintsService.remove(payload.id);
  }
}