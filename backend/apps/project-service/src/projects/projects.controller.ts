import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  PROJECT_PATTERNS,
  CreateProjectDto,
  UpdateProjectDto,
  PROJECT_EXCHANGE,
} from '@app/contracts';
import { ProjectsService } from './projects.service';

@Controller()
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) { }

  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.CREATE,
    queue: PROJECT_PATTERNS.CREATE,
  })
  create(createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.GET_BY_ID,
    queue: PROJECT_PATTERNS.GET_BY_ID,
  })
  findOne(payload: { id: string }) {
    return this.projectService.findOne(payload.id);
  }

  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.UPDATE,
    queue: PROJECT_PATTERNS.UPDATE,
  })
  update(payload: { id: string; updateProjectDto: UpdateProjectDto }) {
    return this.projectService.update(payload.id, payload.updateProjectDto);
  }

  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.REMOVE,
    queue: PROJECT_PATTERNS.REMOVE,
  })

  remove(payload: { id: string }) {
    return this.projectService.remove(payload.id);
  }

  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.FIND_ALL_BY_TEAM_ID,
    queue: PROJECT_PATTERNS.FIND_ALL_BY_TEAM_ID,
  })
  findAllByTeamId(payload: { teamId: string }) {
    return this.projectService.findAllByTeamId(payload.teamId);
  }
}