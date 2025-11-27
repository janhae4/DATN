import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq'; 
import {
  PROJECT_PATTERNS,
  CreateProjectDto,
  UpdateProjectDto,
  PROJECT_EXCHANGE,
} from '@app/contracts';
import { ProjectsService } from './projects.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  // --- CREATE ---
  @MessagePattern(PROJECT_PATTERNS.CREATE)
  async create(createProjectDto: CreateProjectDto) {
    console.log('Received create request:', createProjectDto);
    return await this.projectService.create(createProjectDto);
  }

  // --- READ ---

  @MessagePattern(PROJECT_PATTERNS.GET_BY_ID)
  async findOne(payload: { id: string }) {
    const project = await this.projectService.findOne(payload.id);
    return project;
  }

 
  @MessagePattern(PROJECT_PATTERNS.UPDATE)
  async update(payload: { id: string; updateProjectDto: UpdateProjectDto }) {
    const { id, updateProjectDto } = payload;
    return await this.projectService.update(id, updateProjectDto);
  }

  @MessagePattern(PROJECT_PATTERNS.REMOVE)
  async remove(payload: { id: string }) {
    return await this.projectService.remove(payload.id);
  }
}
