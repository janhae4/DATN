import { Injectable } from '@nestjs/common';
import {
  CreateProjectDto,
  EVENTS_EXCHANGE,
  LIST_EXCHANGE,
  LIST_PATTERNS,
  UpdateProjectDto,
} from '@app/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '@app/contracts/project/entity/project.entity';
import { PROJECT_EVENTS } from '@app/contracts/events/project.events';
import { RmqClientService } from '@app/common';

@Injectable()
export class ProjectsService {

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly amqp: RmqClientService,
  ) { }

  async create(createProjectDto: CreateProjectDto) {
    console.log('Creating project with data:', createProjectDto);
    const projectEntity = this.projectRepository.create(createProjectDto);
    const savedProject = await this.projectRepository.save(projectEntity);
    this.amqp.publish(EVENTS_EXCHANGE, PROJECT_EVENTS.PROJECT_CREATED, { projectName: savedProject.name, projectId: savedProject.id })
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
