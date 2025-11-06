import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, ProjectPatterns, UpdateProjectDto } from '@app/contracts'; // Import từ Libs

@Controller() // Bỏ prefix '/projects'
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @MessagePattern(ProjectPatterns.create)
  create(
    @Payload()
    payload: { createProjectDto: CreateProjectDto; ownerId: string },
  ) {
    return this.projectsService.create(
      payload.createProjectDto,
      payload.ownerId,
    );
  }

  @MessagePattern(ProjectPatterns.findAll)
  findAll(@Payload() payload: { userId: string }) {
    return this.projectsService.findAllByUser(payload.userId);
  }

  @MessagePattern(ProjectPatterns.getById)
  findOne(@Payload() payload: { projectId: string }) {
    return this.projectsService.findOne(payload.projectId);
  }

  @MessagePattern(ProjectPatterns.update)
  update(
    @Payload()
    payload: { projectId: string; updateProjectDto: UpdateProjectDto },
  ) {
    return this.projectsService.update(
      payload.projectId,
      payload.updateProjectDto,
    );
  }

  @MessagePattern(ProjectPatterns.remove)
  remove(@Payload() payload: { projectId: string }) {
    return this.projectsService.remove(payload.projectId);
  }
}