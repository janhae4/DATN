import { Injectable } from '@nestjs/common';
import { RmqClientService } from '@app/common';
import {
  CreateEpicDto,
  UpdateEpicDto,
  EPIC_PATTERNS,
  EPIC_EXCHANGE
} from '@app/contracts';

@Injectable()
export class EpicService {
  constructor(
    private readonly rmqClient: RmqClientService,
  ) { }

  async create(createEpicDto: CreateEpicDto, userId: string) {
    console.log("create epic in gateway: ", createEpicDto);
    return this.rmqClient.request({
      exchange: EPIC_EXCHANGE,
      routingKey: EPIC_PATTERNS.CREATE,
      payload: {createEpicDto, userId},
    });
  }

  async findAllByProjectId(projectId: string) {
    return this.rmqClient.request({
      exchange: EPIC_EXCHANGE,
      routingKey: EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId },
    });
  }

  async findOne(id: string) {
    return this.rmqClient.request({
      exchange: EPIC_EXCHANGE,
      routingKey: EPIC_PATTERNS.FIND_ONE_BY_ID,
      payload: { epicId: id },
    });
  }

  async update(id: string, updateEpicDto: UpdateEpicDto) {
    return this.rmqClient.request({
      exchange: EPIC_EXCHANGE,
      routingKey: EPIC_PATTERNS.UPDATE,
      payload: { epicId: id, updateEpicDto },
    });
  }

  async remove(id: string) {
    return this.rmqClient.request({
      exchange: EPIC_EXCHANGE,
      routingKey: EPIC_PATTERNS.REMOVE,
      payload: { epicId: id },
    });
  }
}