import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CreateListDto, UpdateListDto, LIST_PATTERNS } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class ListService {
  constructor(private readonly amqp: AmqpConnection) {}

  async create(createListDto: CreateListDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'status_exchange',
      routingKey: LIST_PATTERNS.CREATE,
      payload: createListDto,
    }));
  }

  async findOne(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'status_exchange',
      routingKey: LIST_PATTERNS.FIND_ONE_BY_ID,
      payload: { id },
    }));
  }

  async update(id: string, updateListDto: UpdateListDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'status_exchange',
      routingKey: LIST_PATTERNS.UPDATE,
      payload: { id, updateListDto },
    }));
  }

  async remove(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'status_exchange',
      routingKey: LIST_PATTERNS.REMOVE,
      payload: { id },
    }));
  }
}