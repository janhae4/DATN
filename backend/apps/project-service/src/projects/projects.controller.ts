import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices'; // <-- Hàng "chính chủ"
import { PROJECT_PATTERNS, CreateProjectDto, UpdateProjectDto } from '@app/contracts';
import { ProjectsService } from './projects.service';

@Controller()
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  // --- CREATE ---
  @MessagePattern(PROJECT_PATTERNS.CREATE) 
  create(@Payload() createProjectDto: CreateProjectDto) {
    console.log("createProjectDto in Service",createProjectDto);
    return this.projectService.create(createProjectDto);

  }
  
  // --- READ ---
  @MessagePattern(PROJECT_PATTERNS.GET_BY_ID)
  async findOne(@Payload() payload: { id: string }) {
    const project = await this.projectService.findOne(payload.id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  // --- UPDATE ---
  @MessagePattern(PROJECT_PATTERNS.UPDATE)
  update(@Payload() payload: { id: string; updateProjectDto: UpdateProjectDto }) {
    const { id, updateProjectDto } = payload;
    return this.projectService.update(id, updateProjectDto);
  }

  // --- DELETE ---
  @MessagePattern(PROJECT_PATTERNS.REMOVE)
  remove(@Payload() payload: { id: string }) {
    return this.projectService.remove(payload.id);
  }
}