import { Injectable } from '@nestjs/common';
import { RmqClientService } from '@app/common';
import { 
  CreateSprintDto, 
  SPRINT_EXCHANGE, 
  SPRINT_PATTERNS, 
  SprintStatus, 
  UpdateSprintDto 
} from '@app/contracts';

@Injectable()
export class SprintService {
  constructor(
    private readonly rmqClient: RmqClientService
  ) { }

  async create(createSprintDto: CreateSprintDto) {
    return await this.rmqClient.request({
      exchange: SPRINT_EXCHANGE,
      routingKey: SPRINT_PATTERNS.CREATE,
      payload: createSprintDto,
    });
  }

  async findAllByProjectId(projectId: string, userId: string) {
    return await this.rmqClient.request({
      exchange: SPRINT_EXCHANGE,
      routingKey: SPRINT_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId, userId },
    });
  }

  async findOne(id: string, userId: string) {
    return await this.rmqClient.request({
      exchange: SPRINT_EXCHANGE,
      routingKey: SPRINT_PATTERNS.FIND_ONE_BY_ID,
      payload: { id, userId },
    });
  }

  async update(id: string, updateSprintDto: UpdateSprintDto, userId: string) {
    return await this.rmqClient.request({
      exchange: SPRINT_EXCHANGE,
      routingKey: SPRINT_PATTERNS.UPDATE,
      payload: { id, updateSprintDto, userId },
    });
  }

  async remove(id: string, userId: string) {
    return await this.rmqClient.request({
      exchange: SPRINT_EXCHANGE,
      routingKey: SPRINT_PATTERNS.REMOVE,
      payload: { id, userId },
    });
  }

  async completeSprint(id: string, userId: string) {
    return await this.rmqClient.request({
      exchange: SPRINT_EXCHANGE,
      routingKey: SPRINT_PATTERNS.COMPLETE_SPRINT,
      payload: { id, userId },
    });
  }

  async findAll(projectId: string, teamId: string, userId: string, status?: SprintStatus[]) {
    return await this.rmqClient.request({
      exchange: SPRINT_EXCHANGE,
      routingKey: SPRINT_PATTERNS.FIND_ALL,
      payload: { projectId, teamId, status, userId },
    });
  }
}