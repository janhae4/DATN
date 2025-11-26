import { Injectable } from '@nestjs/common';
import {
  CreateProjectDto,
  UpdateProjectDto,
  LIST_PATTERNS,
  LIST_EXCHANGE,
} from '@app/contracts';
import { defaultStatuses } from './constants/default-statuses';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Project } from '@app/contracts/project/entity/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  // --- CREATE ---
  async create(createProjectDto: CreateProjectDto) {
    // Permission checks (e.g., if the user is part of the teamId)
    // should be handled in the API gateway or a dedicated auth guard
    // before this service method is called.

    const projectEntity = this.projectRepository.create(createProjectDto);

    const savedProject = await this.projectRepository.save(projectEntity);

    // After saving the project, create the default statuses via RabbitMQ
    this.amqpConnection.publish(
      LIST_EXCHANGE,
      LIST_PATTERNS.CREATE_DEFAULT,
      {
        projectId: savedProject.id,
        statuses: defaultStatuses,
      },
    );

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