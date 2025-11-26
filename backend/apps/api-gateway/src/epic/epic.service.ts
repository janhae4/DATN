import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CreateEpicDto, UpdateEpicDto, EPIC_PATTERNS } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class EpicService {
  constructor(private readonly amqp: AmqpConnection) {}

  async create(createEpicDto: CreateEpicDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'epic_exchange',
      routingKey: EPIC_PATTERNS.CREATE,
      payload: createEpicDto,
    }));
  }

  async findAllByProjectId(projectId: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'epic_exchange',
      routingKey: EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId },
    }));
  }

  async findOne(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'epic_exchange',
      routingKey: EPIC_PATTERNS.FIND_ONE_BY_ID,
      payload: { epicId: id },
    }));
  }

  async update(id: string, updateEpicDto: UpdateEpicDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'epic_exchange',
      routingKey: EPIC_PATTERNS.UPDATE,
      payload: { epicId: id, updateEpicDto },
    }));
  }

  async remove(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'epic_exchange',
      routingKey: EPIC_PATTERNS.REMOVE,
      payload: { epicId: id },
    }));
  }
}