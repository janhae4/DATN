import { Injectable } from '@nestjs/common';
import { RmqClientService } from '@app/common';
import {
  CreateListDto,
  UpdateListDto,
  LIST_PATTERNS,
  LIST_EXCHANGE,
} from '@app/contracts';

@Injectable()
export class ListService {
  constructor(
    private readonly rmqClient: RmqClientService
  ) { }

  async create(createListDto: CreateListDto) {
    return this.rmqClient.request({
      exchange: LIST_EXCHANGE,
      routingKey: LIST_PATTERNS.CREATE,
      payload: createListDto,
    });
  }

  async findOne(id: string) {
    return this.rmqClient.request({
      exchange: LIST_EXCHANGE,
      routingKey: LIST_PATTERNS.FIND_ONE_BY_ID,
      payload: { id },
    });
  }

  async findAllByProject(projectId: string) {
    return this.rmqClient.request({
      exchange: LIST_EXCHANGE,
      routingKey: LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId },
    });
  }

  async update(id: string, updateListDto: UpdateListDto) {
    return this.rmqClient.request({
      exchange: LIST_EXCHANGE,
      routingKey: LIST_PATTERNS.UPDATE,
      payload: { id, updateListDto },
    });
  }

  async remove(id: string) {
    return this.rmqClient.request({
      exchange: LIST_EXCHANGE,
      routingKey: LIST_PATTERNS.REMOVE,
      payload: { id },
    });
  }
}