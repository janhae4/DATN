import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CreateLabelDto, UpdateLabelDto, LABEL_PATTERNS } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class LabelService {
  constructor(private readonly amqp: AmqpConnection) {}

  async create(createLabelDto: CreateLabelDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'label_exchange',
      routingKey: LABEL_PATTERNS.CREATE,
      payload: createLabelDto,
    }));
  }

  async findAllByProject(projectId: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'label_exchange',
      routingKey: LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId },
    }));
  }

  async findOne(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'label_exchange',
      routingKey: LABEL_PATTERNS.FIND_ONE_BY_ID,
      payload: { id },
    }));
  }

  async update(id: string, updateLabelDto: UpdateLabelDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'label_exchange',
      routingKey: LABEL_PATTERNS.UPDATE,
      payload: { id, updateLabelDto },
    }));
  }

  async remove(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'label_exchange',
      routingKey: LABEL_PATTERNS.REMOVE,
      payload: { id },
    }));
  }
}