import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq'; // <-- Xài cái này
import {
  PROJECT_PATTERNS,
  CreateProjectDto,
  UpdateProjectDto,
  PROJECT_EXCHANGE,
} from '@app/contracts';
import { ProjectsService } from './projects.service';
import { customErrorHandler } from '@app/common';

@Controller()
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  // --- CREATE ---
  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.CREATE,
    queue: PROJECT_PATTERNS.CREATE,
    
    errorHandler: customErrorHandler,
  })
  async create(createProjectDto: CreateProjectDto) {
    console.log('Received create request:', createProjectDto);
    return await this.projectService.create(createProjectDto);
  }

  // --- READ ---
  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.GET_BY_ID,
    queue: PROJECT_PATTERNS.GET_BY_ID,
    errorHandler: customErrorHandler,
  })
  async findOne(payload: { id: string }) {
    const project = await this.projectService.findOne(payload.id);
    return project;
  }

  // --- UPDATE ---
  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.UPDATE,
    queue: PROJECT_PATTERNS.UPDATE,
    errorHandler: customErrorHandler,
  })
  async update(payload: { id: string; updateProjectDto: UpdateProjectDto }) {
    const { id, updateProjectDto } = payload;
    return await this.projectService.update(id, updateProjectDto);
  }

  // --- DELETE ---
  @RabbitRPC({
    exchange: PROJECT_EXCHANGE,
    routingKey: PROJECT_PATTERNS.REMOVE,
    queue: PROJECT_PATTERNS.REMOVE,
    errorHandler: customErrorHandler,
  })
  async remove(payload: { id: string }) {
    return await this.projectService.remove(payload.id);
  }
}
