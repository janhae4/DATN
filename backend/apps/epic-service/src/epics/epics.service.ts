import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateEpicDto,
  Epic,
  MemberRole,
  Project,
  PROJECT_EXCHANGE,
  PROJECT_PATTERNS,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  UpdateEpicDto
} from '@app/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { RmqClientService } from '@app/common';

@Injectable()
export class EpicsService {
  constructor(
    @InjectRepository(Epic)
    private readonly epicRepository: Repository<Epic>,
    private readonly amqp: RmqClientService
  ) { }

  async create(createEpicDto: CreateEpicDto, userId: string) {
      const project = await this.amqp.request<Project>({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.GET_BY_ID,
      payload: { id: createEpicDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const teamId = createEpicDto.teamId || project.teamId;

    // 2. Verify permission
    await this.amqp.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: {
        userId,
        teamId,
        roles: [MemberRole.MEMBER, MemberRole.ADMIN, MemberRole.OWNER]
      },
    });

    const existingEpic = await this.epicRepository.findOne({
      where: {
        projectId: createEpicDto.projectId,
        title: ILike(createEpicDto.title.trim())
      }
    });

    if (existingEpic) return existingEpic;

    const epic = this.epicRepository.create({
      ...createEpicDto,
      teamId: teamId
    });
    return this.epicRepository.save(epic);
  }

  async findAllByProject(projectId: string, userId: string) {
    const project = await this.amqp.request<Project>({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.GET_BY_ID,
      payload: { id: projectId },
    });

    if (project) {
      await this.amqp.request({
        exchange: TEAM_EXCHANGE,
        routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
        payload: {
          userId,
          teamId: project.teamId,
          roles: [MemberRole.MEMBER, MemberRole.ADMIN, MemberRole.OWNER]
        },
      });
    }

    return this.epicRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(epicId: string) {
    return this.epicRepository.findOne({
      where: { id: epicId },
    });
  }

  update(epicId: string, updateEpicDto: UpdateEpicDto) {
    return this.epicRepository.update(epicId, updateEpicDto);
  }

  remove(epicId: string) {
    return this.epicRepository.delete(epicId);
  }
}
