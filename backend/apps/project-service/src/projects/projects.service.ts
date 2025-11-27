import { Inject, Injectable } from '@nestjs/common';
import {
  CreateProjectDto,
  UpdateProjectDto,
  LIST_PATTERNS,
  LIST_EXCHANGE,
  PROJECT_EXCHANGE,
  EVENTS,
} from '@app/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '@app/contracts/project/entity/project.entity';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { PROJECT_EVENTS } from '@app/contracts/events/project.events';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @Inject(LIST_EXCHANGE) private readonly listClient: ClientProxy,
  ) {}

  // --- CREATE ---
  async create(createProjectDto: CreateProjectDto) {
    console.log('Creating project with data:', createProjectDto);
    const projectEntity = this.projectRepository.create(createProjectDto);
    const savedProject = await this.projectRepository.save(projectEntity);

    // Emit event to List Service to create default lists/statuses
    this.listClient.emit(PROJECT_EVENTS.PROJECT_CREATED, {
      projectId: savedProject.id,
      projectName: savedProject.name,
    });
    return savedProject;
  }

  // --- READ ---
  async findOne(id: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
    });
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  // --- UPDATE ---
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.projectRepository.update(id, updateProjectDto);
    return this.findOne(id);
  }

  // --- DELETE ---
  async remove(id: string) {
    // In a real-world scenario, you might want to soft-delete
    // or archive the project instead of a hard delete.
    // The new schema has `isArchived`, so we should use that.
    await this.projectRepository.update(id, { isArchived: true });
    return { message: 'Project archived successfully' };
  }
}
