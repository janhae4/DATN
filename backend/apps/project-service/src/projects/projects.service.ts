import { Inject, Injectable } from '@nestjs/common';
import {
  CreateProjectDto,
  UpdateProjectDto,
  LIST_EXCHANGE,
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

  async create(createProjectDto: CreateProjectDto) {
    console.log('Creating project with data:', createProjectDto);
    const projectEntity = this.projectRepository.create(createProjectDto);
    const savedProject = await this.projectRepository.save(projectEntity);

    this.listClient.emit(PROJECT_EVENTS.PROJECT_CREATED, {
      projectId: savedProject.id,
      projectName: savedProject.name,
    });
    return savedProject;
  }

  async findOne(id: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
    });
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectRepository.preload({
      id: id,
      ...updateProjectDto,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return await this.projectRepository.save(project);
  }

  async remove(id: string) {
    await this.projectRepository.delete(id);
    return { message: 'Project deleted successfully' };
  }

  async findAllByTeamId(teamId: string) {
    return await this.projectRepository.find({
      where: { teamId: teamId },
    });
  }
}
