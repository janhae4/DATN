import { Injectable } from '@nestjs/common';
import { RmqClientService } from '@app/common';
import {
  CreateProjectDto,
  UpdateProjectDto,
  PROJECT_PATTERNS,
  PROJECT_EXCHANGE,
  TASK_PATTERNS,
  TASK_EXCHANGE,
} from '@app/contracts';

@Injectable()
export class ProjectService {
  constructor(
    private readonly rmqClient: RmqClientService,
  ) { }

  async create(createProjectDto: CreateProjectDto) {
    console.log('Creating project with data:', createProjectDto);
    return this.rmqClient.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.CREATE,
      payload: createProjectDto,
    });
  }

  async getStat(id: string, userId: string) {
    return this.rmqClient.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.GET_STATS,
      payload: { userId, projectId: id },
    });
  }


  async findOne(id: string) {
    return this.rmqClient.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.GET_BY_ID,
      payload: { id },
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    return this.rmqClient.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.UPDATE,
      payload: { id, updateProjectDto },
    });
  }

  async remove(id: string) {
    return this.rmqClient.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.REMOVE,
      payload: { id },
    });
  }

  async findAllByTeamId(teamId: string) {
    return this.rmqClient.request({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.FIND_ALL_BY_TEAM_ID,
      payload: { teamId },
    });
  }
}